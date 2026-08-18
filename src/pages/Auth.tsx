import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, Mail, UserX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);
  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);

      console.log("signed in");

      navigate(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);

      setError("The verification code you entered is incorrect.");
      setIsLoading(false);

      setOtp("");
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Attempting anonymous sign in...");
      await signIn("anonymous");
      console.log("Anonymous sign in successful");
      navigate(redirect);
    } catch (error) {
      console.error("Guest login error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      setError(`Failed to sign in as guest: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0b0d]">
      {/* Caution stripe top */}
      <div
        className="h-2.5 w-full shrink-0"
        style={{
          background: `repeating-linear-gradient(45deg, #ffcc00, #ffcc00 14px, #1a1a1c 14px, #1a1a1c 28px)`,
        }}
      />

      {/* Auth Content */}
      <div
        className="flex-1 flex items-center justify-center px-6"
        style={{
          background: `
            radial-gradient(ellipse 900px 500px at 50% 0%, rgba(255,43,61,0.08), transparent 60%),
            radial-gradient(ellipse 700px 400px at 15% 100%, rgba(255,204,0,0.03), transparent 60%)
          `,
        }}
      >
        <Card className="min-w-[350px] max-w-[400px] pb-0 border border-[#26262a] bg-[#141416] shadow-2xl">
          {step === "signIn" ? (
            <>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="font-anton text-3xl tracking-tight text-[#f4f2ee]">
                    OVER<span className="text-[#ff2b3d]">KILL</span>
                  </div>
                </div>
                <CardTitle className="text-xl font-oswald tracking-wide text-[#f4f2ee]">
                  ENTRAR NO SHOPPING
                </CardTitle>
                <CardDescription className="text-[#7c7c82]">
                  Entre com seu email ou jogue como visitante
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleEmailSubmit}>
                <CardContent>
                  <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-[#7c7c82]" />
                      <Input
                        name="email"
                        placeholder="seu@email.com"
                        type="email"
                        className="pl-9 bg-[#0b0b0d] border-[#26262a] text-[#f4f2ee] placeholder:text-[#52525a] focus-visible:ring-[#ff2b3d]"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="outline"
                      size="icon"
                      disabled={isLoading}
                      className="border-[#26262a] bg-[#1a1a1c] hover:bg-[#ff2b3d] hover:border-[#ff2b3d] text-[#f4f2ee] cursor-pointer"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-[#ff2b3d]">{error}</p>
                  )}

                  <div className="mt-4">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-[#26262a]" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#141416] px-2 text-[#7c7c82] font-oswald tracking-wider">
                          Ou
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-4 border-[#26262a] bg-[#1a1a1c] hover:bg-[#26262a] text-[#f4f2ee] font-oswald tracking-wider cursor-pointer"
                      onClick={handleGuestLogin}
                      disabled={isLoading}
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Entrar como Visitante
                    </Button>
                  </div>
                </CardContent>
              </form>
            </>
          ) : (
            <>
              <CardHeader className="text-center mt-4">
                <CardTitle className="font-oswald tracking-wide text-[#f4f2ee]">
                  Verifique seu email
                </CardTitle>
                <CardDescription className="text-[#7c7c82]">
                  Enviamos um código para {step.email}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleOtpSubmit}>
                <CardContent className="pb-4">
                  <input type="hidden" name="email" value={step.email} />
                  <input type="hidden" name="code" value={otp} />

                  <div className="flex justify-center">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                          const form = (e.target as HTMLElement).closest("form");
                          if (form) {
                            form.requestSubmit();
                          }
                        }
                      }}
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, index) => (
                          <InputOTPSlot
                            key={index}
                            index={index}
                            className="bg-[#0b0b0d] border-[#26262a] text-[#f4f2ee] focus-visible:ring-[#ff2b3d]"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-[#ff2b3d] text-center">
                      {error}
                    </p>
                  )}
                  <p className="text-sm text-[#7c7c82] text-center mt-4">
                    Não recebeu o código?{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-[#ff2b3d] hover:text-[#ff1526]"
                      onClick={() => setStep("signIn")}
                    >
                      Tentar novamente
                    </Button>
                  </p>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                  <Button
                    type="submit"
                    className="w-full bg-[#ff2b3d] hover:bg-[#ff1526] text-white font-oswald tracking-wider cursor-pointer"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        Verificar código
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep("signIn")}
                    disabled={isLoading}
                    className="w-full text-[#7c7c82] hover:text-[#f4f2ee] hover:bg-[#1a1a1c] cursor-pointer"
                  >
                    Usar outro email
                  </Button>
                </CardFooter>
              </form>
            </>
          )}

          <div className="py-4 px-6 text-xs text-center text-[#52525a] bg-[#0b0b0d] border-t border-[#26262a] rounded-b-lg font-oswald tracking-wider uppercase">
            Protótipo interno —{" "}
            <span className="text-[#7c7c82]">Overkill Mall</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}