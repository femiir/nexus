import Image from "next/image";
import { notFound } from "next/navigation";
import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";

const EventDetailItem = ({ icon, alt, label }: { icon: string; alt: string; label: string }) => (
    <div className="flex-row-gap-2 items-center">
        <Image src={icon} alt={alt} width={17} height={17} />
        <p>{label}</p>
    </div>
);


const EventAgendaItem = ({ item }: { item: string[] | string }) => {
    // Handle both array and stringified array
    const items = Array.isArray(item) 
        ? item 
        : typeof item === 'string' 
            ? JSON.parse(item)
            : [];
    
    return (
        <div className="agenda">
            <h2>Agenda</h2>
            <ul>
                {items.map((agendaItem: string, index: number) => (
                    <li key={`${agendaItem}-${index}`}>{agendaItem}</li>
                ))}
            </ul>
        </div>
    );
};

const EventTags = ({ tags }: { tags: string[] | string }) => {
    // Handle both array and stringified array
    const tagItems = Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
            ? JSON.parse(tags)
            : [];

    return (
        <div className="flex flex-wrap flex-rowgap-1.5">
            {tagItems.map((tag: string, index: number) => (
                <div key={`${tag}-${index}`} className="pill">{tag}</div>
            ))}
        </div>
    );
};

// Don't pre-render any event pages during build
// Pages will be generated on-demand when users visit them
export async function generateStaticParams() {
    return [];
}

const EventDetailPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
    // Await params (Next.js 15+ requirement)
    const { slug } = await params;

    // Directly access database in server component
    let event = null;

    try {
        await connectDB();
        const rawEvent = await Event.findOne({ slug }).lean();
        // Convert to plain object
        event = rawEvent ? JSON.parse(JSON.stringify(rawEvent)) : null;
    } catch (error) {
        console.error("Error fetching event:", error);
        return notFound();
    }

    if (!event) return notFound();
    
    const { description, image, overview, date, time, location, mode, agenda, audience, organizer, tags } = event;
    
    return (
            <section id='event'>
                <div className="header">
                    <h1>Event Description</h1>
                    <p className="mt-2">{description}</p>
                </div>
                <div className="details">
                    {/* Left side - Event Content */}
                    <div className="content">
                        <Image src={image} alt="event poster" width={800} height={800} className="banner" />

                        <section className="flex-col-gap-2">
                            <h2>Overview</h2>
                            <p>{overview}</p>
                        </section>

                        <section className="flex-col-gap-2">
                            <h2>Event Details</h2>
                            <EventDetailItem icon="/icons/calendar.svg" alt="date" label={new Date(date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })} />
                            <EventDetailItem icon="/icons/clock.svg" alt="time" label={time} />
                            <EventDetailItem icon="/icons/pin.svg" alt="location" label={location} />
                            <EventDetailItem icon="/icons/mode.svg" alt="mode" label={mode} />
                            <EventDetailItem icon="/icons/audience.svg" alt="audience" label={audience} />
                        </section>

                        <EventAgendaItem item={agenda} />

                        <section className="flex-col-gap-2">
                            <h2>About the Organizer</h2>
                            <p>{organizer}</p>
                        </section>

                        <EventTags tags={tags} />
                    </div>
                

                    {/*  Right side - Booking form */}
                    <aside className="booking">
                        <p className="text-lg font-semibold">Book Event</p>
                    </aside>
                </div>
            </section>
            

    )
}

export default EventDetailPage;
         