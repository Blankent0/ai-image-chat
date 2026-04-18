import ImageStudio from "@/components/ImageStudio";

export default function Home() {
  return (
    <div className="studio-grain w-screen h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-[1400px] h-full max-h-[920px]">
        <ImageStudio />
      </div>
    </div>
  );
}
