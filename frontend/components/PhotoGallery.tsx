"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

export default function PhotoGallery({ images, title }: { images: string[]; title: string }) {
  const [open, setOpen] = useState(false);
  const small = images.slice(1, 5);

  return (
    <>
      <div className="relative grid h-[300px] grid-cols-1 gap-2 overflow-hidden rounded-xl md:h-[420px] md:grid-cols-4 md:grid-rows-2">
        <img
          src={images[0]}
          alt={title}
          onClick={() => setOpen(true)}
          className="h-full w-full cursor-pointer object-cover hover:brightness-90 md:col-span-2 md:row-span-2"
        />
        {small.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            onClick={() => setOpen(true)}
            className="hidden h-full w-full cursor-pointer object-cover hover:brightness-90 md:block"
          />
        ))}
        <button
          onClick={() => setOpen(true)}
          className="absolute bottom-4 right-4 rounded-lg border border-black bg-white px-4 py-2 text-sm font-medium hover:bg-gray-100"
        >
          Show all photos
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
          <div className="sticky top-0 bg-white p-4">
            <button onClick={() => setOpen(false)} className="rounded-full px-4 py-2 text-lg hover:bg-gray-100">
              ✕ Close
            </button>
          </div>
          <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 pb-16">
            {images.map((src, i) => (
              <img key={i} src={src} alt="" className="w-full rounded-lg" />
            ))}
          </div>
        </div>
      )}
    </>
  );
}