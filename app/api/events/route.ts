import connectDB from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import Event from "@/database/event.model";
import { v2 as cloudinary } from "cloudinary";

export async function POST(request: NextRequest) {

    try{
        await connectDB();

        const reqBody = await request.formData();

        let event;

        try {
            event = Object.fromEntries(reqBody.entries());

        } catch (e) {
            return NextResponse.json({message: "Invalid form data", error: e instanceof Error ? e.message : "Unknown error"}, { status: 400 });
        }
        const file = reqBody.get("image") as File;
        if (!file || !(file instanceof File)) return NextResponse.json({message: "Image file is required"}, { status: 400 });

        const tags = JSON.parse(event.tags as string);
        const agenda = JSON.parse(event.agenda as string);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadImage = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ resource_type: "image", folder: "DevEvents" }, (error, result) => {
                if (error) return reject(error);

                resolve(result);
            }).end(buffer);
        });

        event.image = (uploadImage as {secure_url: string}).secure_url;

        
        const createdEvent  = await Event.create({
            ...event,
            tags: tags,
            agenda: agenda
        });

        return NextResponse.json({message: "Event created successfully", event: createdEvent}, { status: 201 });
    } 
    catch(e){
        console.error("Error handling POST request:", e);
        return NextResponse.json({message: "Internal Server Error", error: e instanceof Error ? e.message : "Unknown error"}, { status: 500 });
    }

  }


export async function GET() {
    try{

        await connectDB();

        const events = await Event.find().sort({  createdAt: -1 });


        return NextResponse.json({message: "Events fetched successfully", events}, { status: 200 });
    }catch(e){
        return NextResponse.json({message: "Internal Server Error", error: e instanceof Error ? e.message : "Unknown error"}, { status: 500 });
    }
}