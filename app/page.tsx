import EventCard from "@/components/EventCard"
import ExploreBtn from "@/components/ExploreBtn"
import { IEvent } from "@/database";
import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";

const Page = async () => {

  // Directly access database in server component (more efficient than API fetch)
  let events: IEvent[] = [];

  try {
    await connectDB();
    const rawEvents = await Event.find().sort({ createdAt: -1 }).lean();
    // Convert to plain objects to satisfy type system
    events = JSON.parse(JSON.stringify(rawEvents));
  } catch (error) {
    console.error("Error fetching events:", error);
    // Return empty array if database is not available (e.g., during build)
    events = [];
  }

  return (
    <section>
      <h1 className="text-center">The Hub for Every Dev <br /> Events you Can&apos;t Miss</h1>
      <p className="text-center mt-5">Hackathons🧑🏾‍💻, Meetup, and Conferences, All in one place.</p>
      <p className="text-center">🌍 Discover, Explore, and Join Developer Events Worldwide!</p>

      <ExploreBtn />
      <div className="mt-20 space-y-7">
        <h3>Featured Events</h3>

        <ul className="events list-none">
            {events && events.length > 0 && events.map((event: IEvent) => (
            <li key={event.title}>
              <EventCard
                title={event.title}
                image={event.image}
                slug={event.slug}
                date={new Date(event.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}                location={event.location}
                time={event.time}
              />
            </li>
          ))}

        </ul>

      </div>
    </section>
  )
}
export default Page