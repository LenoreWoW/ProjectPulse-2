import { useEffect, useState } from 'react';

interface ImageSliderProps {
  images: string[];
  interval?: number;
}

export function ImageSlider({ images, interval = 60000 }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {images.map((image, index) => (
        <div
          key={index}
          className="absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out"
          style={{
            backgroundImage: `url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: index === currentIndex ? 1 : 0,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-black bg-opacity-40" />
    </div>
  );
}