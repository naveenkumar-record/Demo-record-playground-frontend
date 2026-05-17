import { getRequest, postRequest } from "@/config/http.config";
import apiPathConstants from "@/constants/api-path.constants";
import { AuthUser } from "@/interfaces/auth.interface";

interface SignupPayload {
  email: string;
  password: string;
}

interface VerifySignupCodePayload {
  email: string;
  code: string;
}

interface CompleteSignupPayload {
  signupToken: string;
  password: string;
}

interface CheckEmailPayload {
  email: string;
}

interface CheckEmailData {
  exists: boolean;
  hasPassword: boolean;
}

interface VerifyEmailPayload {
  email: string;
  code: string;
}

interface ResendVerificationPayload {
  email: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface GoogleLoginPayload {
  accessToken: string;
}

interface SetPasswordPayload {
  password: string;
}

interface SetPasswordWithCodePayload {
  resetToken: string;
  password: string;
}

interface ForgotPasswordPayload {
  email: string;
}

interface ForgotPasswordData {
  message: string;
}

interface VerifyResetCodePayload {
  email: string;
  code: string;
}

interface ResetPasswordPayload {
  resetToken: string;
  newPassword: string;
}

interface AuthTokenData {
  accessToken: string;
  user: AuthUser;
  hasPassword?: boolean;
  hasOrganization?: boolean;
}

interface RefreshTokenData {
  accessToken: string;
}

interface ProfileResponseData {
  user: AuthUser;
}

const authApi = {
  checkEmail: (data: CheckEmailPayload) =>
    postRequest<CheckEmailData, CheckEmailPayload>(apiPathConstants.auth.checkEmail, data),

  signup: (data: SignupPayload) => postRequest<void, SignupPayload>(apiPathConstants.auth.signup, data),

  verifySignupCode: (data: VerifySignupCodePayload) =>
    postRequest<{ signupToken: string }, VerifySignupCodePayload>(apiPathConstants.auth.verifySignupCode, data),

  completeSignup: (data: CompleteSignupPayload) =>
    postRequest<AuthTokenData, CompleteSignupPayload>(apiPathConstants.auth.completeSignup, data),

  verifyEmail: (data: VerifyEmailPayload) =>
    postRequest<AuthTokenData, VerifyEmailPayload>(apiPathConstants.auth.verifyEmail, data),

  resendVerification: (data: ResendVerificationPayload) =>
    postRequest<void, ResendVerificationPayload>(apiPathConstants.auth.resendVerification, data),

  login: (data: LoginPayload) => postRequest<AuthTokenData, LoginPayload>(apiPathConstants.auth.login, data),

  googleLogin: (data: GoogleLoginPayload) =>
    postRequest<AuthTokenData, GoogleLoginPayload>(apiPathConstants.auth.googleLogin, data),

  setPassword: (data: SetPasswordPayload, accessToken: string) =>
    postRequest<{ hasOrganization: boolean }, SetPasswordPayload>(apiPathConstants.auth.setPassword, data, {
      accessToken,
    }),

  setPasswordWithCode: (data: SetPasswordWithCodePayload) =>
    postRequest<{ hasOrganization: boolean }, SetPasswordWithCodePayload>(apiPathConstants.auth.setPasswordWithCode, data),

  forgotPassword: (data: ForgotPasswordPayload) =>
    postRequest<ForgotPasswordData, ForgotPasswordPayload>(apiPathConstants.auth.forgotPassword, data),

 verifyResetCode: (data: VerifyResetCodePayload) =>
  postRequest<{ resetToken: string }, VerifyResetCodePayload>(apiPathConstants.auth.verifyResetCode, data),

  resetPassword: (data: ResetPasswordPayload) =>
    postRequest<void, ResetPasswordPayload>(apiPathConstants.auth.resetPassword, data),

  refreshToken: () => postRequest<RefreshTokenData>(apiPathConstants.auth.refreshToken),

  logout: (accessToken: string) =>
    postRequest<void>(apiPathConstants.auth.logout, undefined, {
      accessToken,
    }),

  getProfile: (accessToken: string) =>
    getRequest<ProfileResponseData>(apiPathConstants.auth.profile, {
      accessToken,
    }),
};

export default authApi;