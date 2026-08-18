import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites, useRemoveFavorite } from '@/hooks/useFavorites';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  HeartOff,
  Sparkles, 
  TrendingUp, 
  LogOut,
  ArrowRight,
  Brain,
  Target,
  Zap,
  Chrome,
  Link2,
  LockKeyhole,
  Loader2,
  MessageCircle
} from 'lucide-react';
import type { Tool } from '@/hooks/useTools';
import type { Database, Json } from '@/types/supabase';
import type { Provider, UserIdentity } from '@supabase/supabase-js';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type FavoriteWithTool = Database['public']['Tables']['user_favorites']['Row'] & { tools?: Tool | null };

interface UserActivity {
  id: string;
  activity_type: string;
  tool_id: string | null;
  metadata: Json | null;
  created_at: string;
  tools?: Tool;
}

export function MyPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: favorites, isLoading: favoritesLoading } = useFavorites();
  const removeFavorite = useRemoveFavorite();
  
  const [activeTab, setActiveTab] = useState<'favorites' | 'interests' | 'recommendations'>('favorites');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [recommendations, setRecommendations] = useState<Tool[]>([]);
  const [identities, setIdentities] = useState<UserIdentity[]>([]);
  const [identityLoading, setIdentityLoading] = useState<Provider | 'list' | null>('list');
  const [identityMessage, setIdentityMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadIdentities = useCallback(async () => {
    setIdentityLoading('list');
    const { data, error } = await supabase.auth.getUserIdentities();
    if (error) {
      setIdentityMessage({ type: 'error', text: '연결된 로그인 계정을 확인하지 못했습니다.' });
    } else {
      setIdentities(data?.identities ?? []);
    }
    setIdentityLoading(null);
  }, []);

  useEffect(() => {
    if (!user) return;
    void loadIdentities();

    const params = new URLSearchParams(window.location.search);
    if (params.get('identity_linked') === '1') {
      const linkedProvider = params.get('provider');
      setIdentityMessage({ type: 'success', text: '로그인 계정이 연결되었습니다.' });
      if (linkedProvider === 'google' || linkedProvider === 'kakao') {
        void supabase.rpc('record_auth_audit_event', { p_event_type: 'identity_linked', p_provider: linkedProvider, p_metadata: {} });
      }
      params.delete('identity_linked');
      params.delete('provider');
      const query = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
    }
  }, [user, loadIdentities]);

  const linkIdentity = async (provider: 'google' | 'kakao') => {
    setIdentityMessage(null);
    setIdentityLoading(provider);
    const redirectTo = `${window.location.origin}${window.location.pathname}?identity_linked=1&provider=${provider}`;
    const { error } = await supabase.auth.linkIdentity({ provider, options: { redirectTo } });
    if (error) {
      const alreadyLinked = error.message.toLowerCase().includes('already');
      setIdentityMessage({
        type: 'error',
        text: alreadyLinked ? '이미 다른 회원에 연결된 계정입니다.' : '계정을 연결하지 못했습니다. 잠시 후 다시 시도해주세요.',
      });
      setIdentityLoading(null);
    }
  };

  // Fetch user profile and activities
  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
        } else {
          // Create default profile if not exists
          const defaultInterests = analyzeInterests([]);
          const { data: newProfile } = await supabase
            .from('user_profiles')
            .insert({
              id: user.id,
              display_name: user.user_metadata?.full_name || user.email?.split('@')[0],
              avatar_url: user.user_metadata?.avatar_url,
              interests: defaultInterests,
              preferred_categories: [],
              usage_stats: {}
            })
            .select()
            .single();
          setProfile(newProfile);
        }

        // Fetch recent activities
        const { data: activityData } = await supabase
          .from('user_activities')
          .select(`
            *,
            tools (*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);
        
        const typedActivities = (activityData || []) as unknown as UserActivity[];
        setActivities(typedActivities);

        // Generate recommendations based on favorites and activities
        await generateRecommendations(typedActivities, (favorites || []) as unknown as FavoriteWithTool[]);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user, favorites]);

  // Analyze interests from activities and favorites
  const analyzeInterests = (userActivities: UserActivity[]): string[] => {
    const categoryCount: Record<string, number> = {};
    
    userActivities.forEach(activity => {
      if (activity.tools?.description) {
        const hashtags = activity.tools.description.match(/#[\w가-힣]+/g) || [];
        hashtags.forEach((tag: string) => {
          categoryCount[tag] = (categoryCount[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
  };

  // Generate AI tool recommendations
  const generateRecommendations = async (userActivities: UserActivity[], userFavorites: FavoriteWithTool[]) => {
    try {
      const favoriteIds = userFavorites.map(f => f.tool_id);
      const activityToolIds = userActivities.map(a => a.tool_id).filter(Boolean);
      const excludeIds = [...new Set([...favoriteIds, ...activityToolIds])];

      // Fetch recommendations
      let query = supabase
        .from('tools')
        .select('*')
        .order('visit_count', { ascending: false })
        .limit(6);

      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data: recs } = await query;
      setRecommendations(recs || []);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    }
  };

  // Calculate interest stats
  const interestStats = useMemo(() => {
    const stats = {
      totalViews: activities.filter(a => a.activity_type === 'view').length,
      totalClicks: activities.filter(a => a.activity_type === 'click').length,
      totalFavorites: favorites?.length || 0,
      topCategories: [] as string[]
    };

    const categoryCount: Record<string, number> = {};
    const interestItems: Array<{ tools?: Tool | null }> = [
      ...activities,
      ...((favorites || []) as unknown as FavoriteWithTool[]),
    ];
    interestItems.forEach(item => {
      const tool = item.tools;
      if (tool?.description) {
        const hashtags = tool.description.match(/#[\w가-힣]+/g) || [];
        hashtags.forEach((tag: string) => {
          categoryCount[tag] = (categoryCount[tag] || 0) + 1;
        });
      }
    });

    stats.topCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);

    return stats;
  }, [activities, favorites]);

  if (!user) {
    return (
      <div className="container py-20 min-h-screen max-w-4xl mx-auto text-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">로그인이 필요합니다</CardTitle>
            <CardDescription>
              MyPage를 이용하려면 로그인해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')} size="lg">
              로그인하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 min-h-screen max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center text-white text-2xl font-bold">
              {profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {profile?.display_name || user.email?.split('@')[0] || '사용자'}님의 페이지
              </h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => signOut()} className="gap-2">
            <LogOut className="w-4 h-4" />
            로그아웃
          </Button>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Link2 className="size-5 text-brand-purple" />
            로그인 계정 연결
          </CardTitle>
          <CardDescription>
            구글과 카카오를 연결하면 어느 계정으로 로그인해도 같은 즐겨찾기와 리뷰를 사용할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {identityMessage && (
            <p role={identityMessage.type === 'error' ? 'alert' : 'status'} className={`rounded-lg border p-3 text-sm ${identityMessage.type === 'error' ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300' : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300'}`}>
              {identityMessage.text}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              { provider: 'google' as const, label: 'Google', icon: Chrome, buttonClass: '' },
              { provider: 'kakao' as const, label: '카카오', icon: MessageCircle, buttonClass: 'border-[#FEE500] hover:bg-[#FEE500]/10' },
            ]).map(({ provider, label, icon: Icon, buttonClass }) => {
              const connected = identities.some(identity => identity.provider === provider);
              const loading = identityLoading === provider;
              return (
                <div key={provider} className="flex items-center justify-between gap-3 rounded-xl border p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Icon className="size-5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{connected ? '연결됨' : '연결되지 않음'}</p>
                    </div>
                  </div>
                  {connected ? (
                    <Badge variant="secondary">연결됨</Badge>
                  ) : (
                    <Button variant="outline" size="sm" className={buttonClass} disabled={identityLoading !== null} onClick={() => linkIdentity(provider)}>
                      {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                      연결하기
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          {identityLoading === 'list' && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />연결 상태를 확인하고 있습니다.</p>}
          <p className="text-xs leading-5 text-muted-foreground">연결 과정에서 선택한 외부 계정이 이미 다른 모두의 AI 회원에 속해 있으면 연결되지 않습니다.</p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <LockKeyhole className="size-5 text-brand-purple" />
            비밀번호 및 보안
          </CardTitle>
          <CardDescription>
            계정 이메일로 본인 인증 후 비밀번호를 변경합니다. 변경이 완료되면 모든 기기에서 로그아웃됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => navigate('/reset-password')}>이메일 인증 후 비밀번호 변경</Button>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">즐겨찾기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500" />
              {interestStats.totalFavorites}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">조회한 도구</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-500" />
              {interestStats.totalViews}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">클릭 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-500" />
              {interestStats.totalClicks}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">주요 관심사</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {interestStats.topCategories.length > 0 ? (
                interestStats.topCategories.map(cat => (
                  <Badge key={cat} variant="secondary" className="text-xs">
                    {cat}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">아직 없음</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
            activeTab === 'favorites' 
              ? 'text-brand-purple border-b-2 border-brand-purple' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Heart className="w-4 h-4" />
          내 AI 카드
        </button>
        <button
          onClick={() => setActiveTab('interests')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
            activeTab === 'interests' 
              ? 'text-brand-purple border-b-2 border-brand-purple' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Target className="w-4 h-4" />
          관심사 분석
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
            activeTab === 'recommendations' 
              ? 'text-brand-purple border-b-2 border-brand-purple' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          추천
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500" />
              내가 즐겨찾는 AI 도구
            </h2>
            {favoritesLoading ? (
              <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
            ) : favorites && favorites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(favorites as unknown as FavoriteWithTool[]).map(favorite => (
                  <Card key={favorite.id} className="group hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => navigate(`/tool/${favorite.tool_id}`)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <img 
                            src={favorite.tools?.logo_url || `https://www.google.com/s2/favicons?domain=${favorite.tools?.url}&sz=128`} 
                            alt={favorite.tools?.name}
                            className="w-10 h-10 rounded-lg"
                          />
                          <div>
                            <CardTitle className="text-lg">{favorite.tools?.name}</CardTitle>
                            <CardDescription className="line-clamp-1">
                              {favorite.tools?.description?.replace(/#[\w가-힣]+/g, '')}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Badge variant="outline">{favorite.tools?.pricing_type}</Badge>
                          {favorite.tools?.is_domestic && <Badge variant="secondary">국내</Badge>}
                        </div>
                        <Button variant="ghost" size="sm" className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          상세보기 <ArrowRight className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`${favorite.tools?.name} 즐겨찾기 해제`}
                          disabled={removeFavorite.isPending}
                          onClick={(event) => {
                            event.stopPropagation();
                            removeFavorite.mutate(favorite.tool_id);
                          }}
                          className="text-muted-foreground hover:text-red-500"
                        >
                          <HeartOff className="size-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="py-12 text-center">
                <CardContent>
                  <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">아직 즐겨찾기한 AI 도구가 없습니다.</p>
                  <Button onClick={() => navigate('/tools')}>
                    AI 도구 둘러보기
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Interests Tab */}
        {activeTab === 'interests' && (
          <>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="w-6 h-6 text-brand-purple" />
              AI가 분석한 나의 관심사
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    주요 관심 카테고리
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {interestStats.topCategories.length > 0 ? (
                    <div className="space-y-3">
                      {interestStats.topCategories.map((cat, index) => (
                        <div key={cat} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">{cat}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-brand-purple rounded-full"
                                style={{ width: `${100 - index * 20}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>아직 충분한 데이터가 없습니다.</p>
                      <p className="text-sm">AI 도구를 더 둘러보면 관심사를 분석해드립니다.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    최근 활동
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activities.length > 0 ? (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {activities.slice(0, 10).map(activity => (
                        <div key={activity.id} className="flex items-center gap-3 text-sm">
                          <Badge variant="outline" className="capitalize">
                            {activity.activity_type === 'view' && '👀 조회'}
                            {activity.activity_type === 'click' && '👆 클릭'}
                            {activity.activity_type === 'favorite' && '❤️ 즐겨찾기'}
                            {activity.activity_type === 'search' && '🔍 검색'}
                          </Badge>
                          <span className="flex-1 truncate">
                            {activity.tools?.name || 'Unknown'}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {new Date(activity.created_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      아직 활동 기록이 없습니다.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              나를 위한 AI 추천
            </h2>
            <p className="text-muted-foreground">
              내 활동 패턴을 분석하여 추천하는 AI 도구들입니다.
            </p>
            
            {recommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map(tool => (
                  <Card key={tool.id} className="group hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-brand-purple/20"
                    onClick={() => navigate(`/tool/${tool.id}`)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <img 
                            src={tool.logo_url || `https://www.google.com/s2/favicons?domain=${tool.url}&sz=128`} 
                            alt={tool.name}
                            className="w-10 h-10 rounded-lg"
                          />
                          <div>
                            <CardTitle className="text-lg">{tool.name}</CardTitle>
                            <CardDescription className="line-clamp-1">
                              {tool.description?.replace(/#[\w가-힣]+/g, '')}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Badge variant="outline">{tool.pricing_type}</Badge>
                          {tool.is_domestic && <Badge variant="secondary">국내</Badge>}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <TrendingUp className="w-4 h-4" />
                          {tool.visit_count?.toLocaleString() || 0} views
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="py-12 text-center">
                <CardContent>
                  <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">추천할 도구를 준비 중입니다...</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
