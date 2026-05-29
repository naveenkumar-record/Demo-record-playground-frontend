const apiPathConstants = {
  auth: {
    checkEmail: "/auth/check-email",
    signup: "/auth/signup",
    verifyEmail: "/auth/verify-email",
    resendVerification: "/auth/resend-verification",
    login: "/auth/login",
    googleLogin: "/auth/google/login",
    setPassword: "/auth/set-password",
    setPasswordWithCode: "/auth/set-password-with-code",
    forgotPassword: "/auth/forgot-password",
    verifySignupCode: "/auth/verify-signup-code",
    completeSignup: "/auth/complete-signup",
    verifyResetCode: "/auth/verify-reset-code",
    resetPassword: "/auth/reset-password",
    refreshToken: "/auth/refresh-token",
    logout: "/auth/logout",
    profile: "/auth/profile",
  },
  memberOrganization: {
    create: "/member-organization/create",
    getOrganization: "/member-organization",
  },
  userAccess: {
    organizations: "/user-access/organizations",
    members: "/user-access/members",
    invite: "/user-access/invite",
    memberBase: "/user-access",
  },
  settings: {
    base: "/settings",
    logo: "/settings/logo",
  },
  apiKeys: {
    base: "/api-keys",
  },
  workflows: {
    base: "/workflows",
    skills: "/workflows/skills",
    searchSkills: "/workflows/skills/search",
  },
  dashboard: {
    stats: "/dashboard/stats",
  },
  billing: {
    overview: "/billing/overview",
    history:  "/billing/history",
    order:    "/billing/order",
    verify:   "/billing/verify",
  },
  projects: {
    base: "/projects",
  },
  bluecollar: {
    requests: "/bluecollar/requests",
  },
  assessments: {
    base:       "/assessments",
    byId:       (id: string) => `/assessments/${id}`,
    sections:   (id: string) => `/assessments/${id}/sections`,
    coding:     (id: string) => `/assessments/${id}/coding`,
    publish:    (id: string) => `/assessments/${id}/publish`,
    toggle:     (id: string) => `/assessments/${id}/toggle`,
    delete:     (id: string) => `/assessments/${id}`,
    questions:  (id: string) => `/assessments/${id}/questions`,
    questionById: (assessmentId: string, questionId: string) =>
      `/assessments/${assessmentId}/questions/${questionId}`,
  },
} as const;

export default apiPathConstants;
