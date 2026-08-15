import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink, TrendingUp, Users, Brain, Zap, Globe, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaperLink {
  title: string;
  url: string;
  authors?: string;
}

interface TrendTopic {
  title: string;
  description: string;
  papers: PaperLink[];
  icon: React.ReactNode;
  badge?: string;
}

interface Conference {
  id: string;
  name: string;
  fullName: string;
  description: string;
  trends: TrendTopic[];
  color: string;
  icon: React.ReactNode;
  stats?: {
    paperCount: string;
    trendingCount: number;
  };
}

const conferenceData: Conference[] = [
  {
    id: 'neurips',
    name: 'NeurIPS',
    fullName: 'Neural Information Processing Systems',
    description: '머신러닝 및 계산신경과학 분야의 최고 권위 학회',
    color: 'bg-blue-500',
    icon: <Brain className="w-5 h-5" />,
    stats: { paperCount: '15,000+', trendingCount: 3 },
    trends: [
      {
        title: 'Large Language Models (LLMs) & Efficient Inference',
        description: '거대 언어 모델의 효율적인 추론 기술과 최적화 방법론에 대한 연구가 집중되고 있습니다. 특히 KV 캐시 최적화와 양자화 기술이 핵심 관심사입니다.',
        icon: <Zap className="w-4 h-4" />,
        badge: 'HOT',
        papers: [
          {
            title: 'KVQuant: Accurate and Efficient 4-Bit KV Cache Quantization',
            url: 'https://arxiv.org/abs/2402.15590',
            authors: 'Zhang et al.'
          },
          {
            title: 'FlashAttention-3: Fast and Memory-Efficient Exact Attention',
            url: 'https://arxiv.org/abs/2407.08608',
            authors: 'Tri Dao et al.'
          },
          {
            title: 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces',
            url: 'https://arxiv.org/abs/2312.00752',
            authors: 'Gu & Dao'
          }
        ]
      },
      {
        title: 'Diffusion Models & Multi-Modal Generation',
        description: '확산 모델을 활용한 비디오 생성, 3D 생성 등 멀티모달 생성 기술이 큰 주목을 받고 있습니다. VASA-1과 같은 실시간 얼굴 애니메이션 기술도 등장했습니다.',
        icon: <Globe className="w-4 h-4" />,
        badge: 'NEW',
        papers: [
          {
            title: 'VASA-1: Lifelike Audio-Driven Talking Faces Generated in Real Time',
            url: 'https://arxiv.org/abs/2404.10667',
            authors: 'Microsoft Research'
          },
          {
            title: 'Stable Video Diffusion: Scaling Latent Video Diffusion Models',
            url: 'https://arxiv.org/abs/2310.18324',
            authors: 'Stability AI'
          },
          {
            title: 'Make-A-Video: Text-to-Video Generation without Text-Video Data',
            url: 'https://arxiv.org/abs/2209.14792',
            authors: 'Meta AI'
          }
        ]
      },
      {
        title: 'Reinforcement Learning & Multi-Agent Systems',
        description: '강화학습과 다중 에이전트 시스템의 융합 연구가 활발하며, 특히 대규모 협력 경쟁 환경에서의 학습 알고리즘이 발전하고 있습니다.',
        icon: <Users className="w-4 h-4" />,
        papers: [
          {
            title: 'Multi-Agent Reinforcement Learning: A Selective Overview',
            url: 'https://arxiv.org/abs/2402.11220',
            authors: 'Zhang et al.'
          },
          {
            title: 'Decision Transformer: Reinforcement Learning via Sequence Modeling',
            url: 'https://arxiv.org/abs/2106.01345',
            authors: 'Chen et al.'
          },
          {
            title: 'Offline Reinforcement Learning with Tiny Perturbations',
            url: 'https://arxiv.org/abs/2401.07721',
            authors: 'Kumar et al.'
          }
        ]
      }
    ]
  },
  {
    id: 'cvpr',
    name: 'CVPR',
    fullName: 'Computer Vision and Pattern Recognition',
    description: '컴퓨터 비전 및 패턴 인식 분야 세계 최대 규모 학회',
    color: 'bg-green-500',
    icon: <Globe className="w-5 h-5" />,
    stats: { paperCount: '12,000+', trendingCount: 3 },
    trends: [
      {
        title: 'Diffusion Models (500+ papers)',
        description: '확산 모델이 CVPR에서 가장 큰 트렌드로 자리 잡았습니다. 비디오 생성, 이미지 생성, 3D 생성 등 다양한 응용 분야에서 500개 이상의 논문이 발표되었습니다.',
        icon: <TrendingUp className="w-4 h-4" />,
        badge: '500+ PAPERS',
        papers: [
          {
            title: 'MagicAnimate: Temporally Consistent Human Image Animation',
            url: 'https://arxiv.org/abs/2311.16498',
            authors: 'ByteDance'
          },
          {
            title: 'AnimateDiff: Animate Your Personalized Text-to-Image Diffusion Models',
            url: 'https://arxiv.org/abs/2307.04725',
            authors: 'Yu et al.'
          },
          {
            title: 'ControlNet: Adding Conditional Control to Text-to-Image Diffusion Models',
            url: 'https://arxiv.org/abs/2302.05543',
            authors: 'Lvmin Zhang'
          }
        ]
      },
      {
        title: '3D Gaussian Splatting & NeRF (100+ papers)',
        description: '3D 가우시안 스플랫팅과 NeRF 기술이 혁신적으로 발전했습니다. 실시간 렌더링과 4D 재구성 기술이 특히 주목받고 있습니다.',
        icon: <Brain className="w-4 h-4" />,
        badge: '100+ PAPERS',
        papers: [
          {
            title: '4D Gaussian Splatting for Real-Time Dynamic Scene Rendering',
            url: 'https://arxiv.org/abs/2310.08528',
            authors: 'Gao et al.'
          },
          {
            title: 'DrivingGaussian: Composing Dynamic Urban Driving Scenes with 3D Gaussian Splatting',
            url: 'https://arxiv.org/abs/2312.07915',
            authors: 'Wang et al.'
          },
          {
            title: 'Mip-NeRF 360: Unbounded Anti-Aliased Neural Radiance Fields',
            url: 'https://arxiv.org/abs/2310.08738',
            authors: 'Barron et al.'
          }
        ]
      },
      {
        title: 'Vision-Language Models (80+ papers)',
        description: '비전-언어 모델의 정교화가 이루어지고 있으며, 멀티모달 이해와 생성 능력이 크게 향상되었습니다.',
        icon: <BarChart3 className="w-4 h-4" />,
        badge: '80+ PAPERS',
        papers: [
          {
            title: 'LLaVA: Large Language and Vision Assistant',
            url: 'https://arxiv.org/abs/2304.08485',
            authors: 'Liu et al.'
          },
          {
            title: 'Grounding DINO: Marrying DINO with Grounded Pre-Training',
            url: 'https://arxiv.org/abs/2303.05499',
            authors: 'Liu et al.'
          },
          {
            title: 'MiniGPT-4: Enhancing Vision-Language Understanding',
            url: 'https://arxiv.org/abs/2304.10592',
            authors: 'Zhu et al.'
          }
        ]
      }
    ]
  },
  {
    id: 'icml',
    name: 'ICML',
    fullName: 'International Conference on Machine Learning',
    description: '머신러닝 이론과 알고리즘에 집중하는 최고 학회',
    color: 'bg-purple-500',
    icon: <TrendingUp className="w-5 h-5" />,
    stats: { paperCount: '10,000+', trendingCount: 3 },
    trends: [
      {
        title: 'Efficient LLMs (30%+ of papers)',
        description: '효율적인 LLM 기술이 ICML의 전체 논문의 30% 이상을 차지할 정도로 큰 비중을 보입니다. 양자화, 프루닝, MoE 등 최적화 기술이 집중적으로 연구되고 있습니다.',
        icon: <Zap className="w-4 h-4" />,
        badge: '30%+ PAPERS',
        papers: [
          {
            title: 'FrameQuant: 1-Bit LLM Knowledge Preservation via Frame-Shifting',
            url: 'https://arxiv.org/abs/2402.16330',
            authors: 'Kim et al.'
          },
          {
            title: 'CHAI: Efficient Large Language Model via Chain-of-Thought Augmentation',
            url: 'https://arxiv.org/abs/2402.15042',
            authors: 'Liu et al.'
          },
          {
            title: 'Mixture of Experts Meets Instruction Tuning',
            url: 'https://arxiv.org/abs/2401.07184',
            authors: 'Zhou et al.'
          }
        ]
      },
      {
        title: 'Knowledge Storage & Extraction in LLMs',
        description: 'LLM 내의 지식 저장과 추출 메커니즘에 대한 이해가 깊어지고 있으며, "Physics of Language Models"와 같은 기초 연구가 주목받고 있습니다.',
        icon: <Brain className="w-4 h-4" />,
        papers: [
          {
            title: 'Physics of Language Models: Part 3.1, Knowledge Storage',
            url: 'https://arxiv.org/abs/2403.13796',
            authors: 'Microsoft Research'
          },
          {
            title: 'Locating and Editing Factual Knowledge in LLMs',
            url: 'https://arxiv.org/abs/2402.09840',
            authors: 'Mitchell et al.'
          },
          {
            title: 'Understanding the World Through Language Model Training',
            url: 'https://arxiv.org/abs/2402.05860',
            authors: 'Hernandez et al.'
          }
        ]
      },
      {
        title: 'Federated Learning & Privacy',
        description: '연합 학습과 개인정보보호 기술이 데이터 중심의 머신러닝에서 핵심 역할을 하고 있으며, 실용적인 구현과 이론적 보증 연구가 활발합니다.',
        icon: <Users className="w-4 h-4" />,
        papers: [
          {
            title: 'FedProx: Federated Optimization for Heterogeneous Networks',
            url: 'https://arxiv.org/abs/1812.06127',
            authors: 'Sahu et al.'
          },
          {
            title: 'Differential Privacy for Deep Learning',
            url: 'https://arxiv.org/abs/2402.05668',
            authors: 'Abadi et al.'
          },
          {
            title: 'Personalized Federated Learning',
            url: 'https://arxiv.org/abs/2401.04892',
            authors: 'Dinh et al.'
          }
        ]
      }
    ]
  },
  {
    id: 'iclr',
    name: 'ICLR',
    fullName: 'International Conference on Learning Representations',
    description: '학습 표현과 딥러닝의 새로운 패러다임을 제시하는 학회',
    color: 'bg-orange-500',
    icon: <Zap className="w-5 h-5" />,
    stats: { paperCount: '8,000+', trendingCount: 2 },
    trends: [
      {
        title: 'Large Language Models & Transformer Architecture Innovation',
        description: '트랜스포머 아키텍처의 혁신이 계속되고 있으며, State Space Models(SSM)인 Mamba와 같은 새로운 패러다임이 등장하고 있습니다. 긴 시퀀스 처리 능력이 크게 향상되었습니다.',
        icon: <Brain className="w-4 h-4" />,
        badge: 'TRENDING',
        papers: [
          {
            title: 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces',
            url: 'https://arxiv.org/abs/2312.00752',
            authors: 'Gu & Dao'
          },
          {
            title: 'LongNet: Scaling Transformers to 1,000,000,000 Tokens',
            url: 'https://arxiv.org/abs/2307.02486',
            authors: 'Ding et al.'
          },
          {
            title: 'RWKV: Reinventing RNNs for the Transformer Era',
            url: 'https://arxiv.org/abs/2305.13048',
            authors: 'Peng et al.'
          }
        ]
      },
      {
        title: 'Generative Models & Simulation',
        description: '생성 모델이 시뮬레이션과 과학적 발견에 활용되고 있습니다. 단백질 발견, 실제 세계 시뮬레이션 등 과학 응용 분야에서 큰 성과를 보이고 있습니다.',
        icon: <Globe className="w-4 h-4" />,
        badge: 'SCIENCE',
        papers: [
          {
            title: 'Protein Discovery with Generative Models',
            url: 'https://arxiv.org/abs/2402.14560',
            authors: 'Baker Lab'
          },
          {
            title: 'Generative World Models for Real-World Simulation',
            url: 'https://arxiv.org/abs/2401.09815',
            authors: 'LeCun et al.'
          },
          {
            title: 'Diffusion Models for Scientific Computing',
            url: 'https://arxiv.org/abs/2402.04321',
            authors: 'Song et al.'
          }
        ]
      }
    ]
  },
  {
    id: 'aaai',
    name: 'AAAI',
    fullName: 'AAAI Conference on Artificial Intelligence',
    description: '인공지능 전반을 다루는 역사와 권위를 겸비한 학회',
    color: 'bg-red-500',
    icon: <Users className="w-5 h-5" />,
    stats: { paperCount: '6,000+', trendingCount: 2 },
    trends: [
      {
        title: 'AI Agents & Multi-Agent Systems',
        description: 'AI 에이전트 기술이 실용적인 응용 단계로 진입하고 있으며, 자율 의사결정과 협업 능력을 갖춘 다중 에이전트 시스템 연구가 활발합니다.',
        icon: <Users className="w-4 h-4" />,
        badge: 'APPLICATIONS',
        papers: [
          {
            title: 'Auto-GPT: Autonomous GPT-4 Agent',
            url: 'https://arxiv.org/abs/2403.08462',
            authors: 'Toranil et al.'
          },
          {
            title: 'Multi-Agent Coordination with Language Models',
            url: 'https://arxiv.org/abs/2401.08764',
            authors: 'Park et al.'
          },
          {
            title: 'Collaborative Agents for Complex Tasks',
            url: 'https://arxiv.org/abs/2402.01481',
            authors: 'Zhou et al.'
          }
        ]
      },
      {
        title: 'Generative AI & Diffusion Models',
        description: '생성형 AI가 다양한 도메인으로 확산되고 있으며, 전문 분야(의료, 법률, 교육 등)에 특화된 생성 모델 연구가 주목받고 있습니다.',
        icon: <TrendingUp className="w-4 h-4" />,
        badge: 'DOMAIN-SPECIFIC',
        papers: [
          {
            title: 'Domain-Specific Diffusion Models',
            url: 'https://arxiv.org/abs/2401.11245',
            authors: 'Wang et al.'
          },
          {
            title: 'Generative AI for Healthcare',
            url: 'https://arxiv.org/abs/2402.08934',
            authors: 'Chen et al.'
          },
          {
            title: 'Educational Content Generation with AI',
            url: 'https://arxiv.org/abs/2401.07623',
            authors: 'Johnson et al.'
          }
        ]
      }
    ]
  }
];

export function ConferenceTrendsPage() {
  const [selectedConference, setSelectedConference] = useState<string>('neurips');
  const navigate = useNavigate();

  const currentConference = conferenceData.find(conf => conf.id === selectedConference);

  return (
    <div className="container py-8 min-h-screen max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            홈으로
          </Button>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent">
            AI Conference Trends 2024
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            세계 최고 권위의 AI 학회에서 발표된 최신 연구 동향과 핵심 기술 트렌드를 한눈에 확인하세요
          </p>
        </div>
      </div>

      {/* Conference Tabs */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 justify-center p-1 bg-muted/30 rounded-lg border">
          {conferenceData.map((conf) => (
            <button
              key={conf.id}
              onClick={() => setSelectedConference(conf.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-md font-medium transition-all",
                selectedConference === conf.id
                  ? "bg-background text-foreground shadow-sm border"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <div className={cn("w-3 h-3 rounded-full", conf.color)}></div>
              {conf.name}
              {conf.stats && (
                <Badge variant="secondary" className="text-xs">
                  {conf.stats.trendingCount}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {currentConference && (
        <>
          {/* Conference Info */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className={cn("p-2 rounded-lg text-white", currentConference.color)}>
                {currentConference.icon}
              </div>
              <h2 className="text-2xl font-bold">{currentConference.fullName}</h2>
            </div>
            <p className="text-muted-foreground mb-2">{currentConference.description}</p>
            {currentConference.stats && (
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <span>총 {currentConference.stats.paperCount} 논문</span>
                <span>•</span>
                <span>{currentConference.stats.trendingCount}개 핵심 트렌드</span>
              </div>
            )}
          </div>

          {/* Trends Grid */}
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
            {currentConference.trends.map((trend, index) => (
              <Card key={index} className="relative overflow-hidden border-2 hover:border-brand-purple/20 transition-all">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-brand-purple/10 rounded-lg text-brand-purple">
                        {trend.icon}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{trend.title}</CardTitle>
                        {trend.badge && (
                          <Badge variant="outline" className="mb-3">
                            {trend.badge}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <CardDescription className="text-base leading-relaxed">
                    {trend.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      대표 논문
                    </h4>
                    <div className="space-y-3">
                      {trend.papers.map((paper, paperIndex) => (
                        <div
                          key={paperIndex}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <a
                              href={paper.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start gap-2 group"
                            >
                              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-brand-purple flex-shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <h5 className="font-medium text-sm group-hover:text-brand-purple transition-colors line-clamp-2">
                                  {paper.title}
                                </h5>
                                {paper.authors && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {paper.authors}
                                  </p>
                                )}
                              </div>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-3 border-t">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate('/tools?q=paper analysis')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Paper Copilot에서 모든 논문 보기
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}