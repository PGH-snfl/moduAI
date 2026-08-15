export const PASSWORD_MIN_LENGTH = 11;

export const PASSWORD_REQUIREMENT_TEXT = '11자 이상이며 영문 대문자, 소문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.';

export function isStrongPassword(password: string) {
  return password.length >= PASSWORD_MIN_LENGTH
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /[0-9]/.test(password)
    && /[^A-Za-z0-9]/.test(password);
}
