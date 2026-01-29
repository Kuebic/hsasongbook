import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Password } from "@convex-dev/auth/providers/Password";
import { ResendOTPEmailVerification } from "./email/ResendOTPEmailVerification";
import { ResendOTPPasswordReset } from "./email/ResendOTPPasswordReset";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Anonymous,
    Password({
      verify: ResendOTPEmailVerification,
      reset: ResendOTPPasswordReset,
    }),
    ResendOTPEmailVerification,
  ],
});
