import EventCard from "@/components/EventCard"
import ExploreBtn from "@/components/ExploreBtn"
import { FEATURED_EVENTS } from "@/lib/constants"

const Page = () => {
  return (
    <section>
      <h1 className="text-center">The Hub for Every Dev <br /> Events you Can&apos;t Miss</h1>
      <p className="text-center mt-5">Hackathons🧑🏾‍💻, Meetup, and Conferences, All in one place.</p>
      <p className="text-center">🌍 Discover, Explore, and Join Developer Events Worldwide!</p>

      <ExploreBtn />
      <div className="mt-20 space-y-7">
        <h3>Featured Events</h3>

        <ul className="events">
            {FEATURED_EVENTS.map((event) => (
            <li key={event.id}>
              <EventCard
                title={event.title}
                image={event.image}
                slug={event.slug}
                date={event.date}
                location={event.location}
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