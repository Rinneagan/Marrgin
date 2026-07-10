export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Quote/Background */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 bg-accent/5 dark:bg-accent/10 border-r border-gray-200 dark:border-gray-800 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <p className="font-poem text-5xl leading-tight mb-8">
            "And now here is my secret, a very simple secret: It is only with the heart that one can see rightly; what is essential is invisible to the eye."
          </p>
          <p className="text-xl text-secondary font-medium">— Antoine de Saint-Exupéry</p>
        </div>
      </div>

      {/* Right Side - Auth Card */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
