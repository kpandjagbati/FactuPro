type Props = {
  src: string;
  alt: string;
  className?: string;
};

export default function UndrawIllustration({ src, alt, className }: Props) {
  return (
    <div className={`undraw-hero ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="mx-auto h-auto w-full max-w-xl" />
    </div>
  );
}
