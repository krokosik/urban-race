export default function NoSession() {
  return (
    <div className="size-full flex flex-col justify-center items-center px-8 gap-8 text-center">
      <h1 className="text-4xl">Session not found</h1>
      <p className="text-lg">Scan the current QR code to join a race!</p>
    </div>
  );
}
