export default function NoSession() {
  return (
    <div className="size-full flex flex-col justify-center items-center px-8 gap-8 text-center">
      <h1 className="text-4xl">Error encountered</h1>
      <p className="text-lg tracking-wide">
        Scan the current QR code to rejoin
      </p>
    </div>
  );
}
