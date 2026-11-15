import Image from "next/image";

const HomePage = () => {
  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col justify-center gap-4 px-6 py-12 sm:px-12">
      <div className="flex items-center gap-4">
        <Image src="/icon.svg" alt="" width={56} height={56} />
        <h1 className="text-accent text-5xl font-semibold tracking-tight">
          Ogma
        </h1>
      </div>
      <p className="text-muted text-lg">Private resume builder</p>
    </main>
  );
};

export default HomePage;
