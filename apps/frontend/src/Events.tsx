export function Events({ events }: { events: { name: string; data: any }[] }) {
  return (
    <ul>
      {events.map((event, index) => (
        <li
          key={index}
        >{`${event.name} --- ${typeof event.data === "object" ? JSON.stringify(event.data) : event.data}`}</li>
      ))}
    </ul>
  );
}
