import EventCard from "@/components/EventCard"
import ExploreBtn from "@/components/ExploreBtn"
import { IEvent } from "@/database";
import { cacheLife } from "next/cache";


const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const Page = async () => {
  'use cache';
  cacheLife('hours');

  const response = await fetch(`${BASE_URL}/api/events`, { cache: 'no-store' });
  const { events } = await response.json();

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