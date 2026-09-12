'use client';

import React, { useState, useRef } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import styles from '@/styles/modules/product-carousel.module.scss';
import { ChevronLeft, ChevronRight, Camera } from 'lucide-react';

interface ProductCarouselProps {
  images: string[];
  altText: string;
}

function PrevArrow(props: any) {
  const { onClick } = props;
  return (
    <button
      type="button"
      className={`${styles.navArrow} ${styles['navArrow--prev']}`}
      onClick={onClick}
      aria-label="Foto anterior"
    >
      <ChevronLeft size={20} />
    </button>
  );
}

function NextArrow(props: any) {
  const { onClick } = props;
  return (
    <button
      type="button"
      className={`${styles.navArrow} ${styles['navArrow--next']}`}
      onClick={onClick}
      aria-label="Foto siguiente"
    >
      <ChevronRight size={20} />
    </button>
  );
}

export default function ProductCarousel({ images = [], altText }: ProductCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const sliderRef = useRef<Slider | null>(null);

  const fallbackImage =
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&fit=crop';

  const validImages = images.filter((img) => typeof img === 'string' && img.trim().length > 0);

  // 1. Si no hay imágenes, mostrar placeholder estándar
  if (validImages.length === 0) {
    return (
      <div className={styles.carouselContainer}>
        <div className={styles.mainWrapper}>
          <img src={fallbackImage} alt={altText} className={styles.singleImage} />
        </div>
      </div>
    );
  }

  // 2. Si solo hay una imagen, no activar el carrusel de Slick
  if (validImages.length === 1) {
    return (
      <div className={styles.carouselContainer}>
        <div className={styles.mainWrapper}>
          <img src={validImages[0]} alt={altText} className={styles.singleImage} />
        </div>
      </div>
    );
  }

  // 3. Si hay 2 o más imágenes, activar Slick Carousel interactivo
  const settings = {
    dots: true,
    infinite: true,
    speed: 350,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    swipe: true,
    adaptiveHeight: false,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    beforeChange: (_current: number, next: number) => setActiveIndex(next),
  };

  const handleThumbClick = (index: number) => {
    setActiveIndex(index);
    if (sliderRef.current) {
      sliderRef.current.slickGoTo(index);
    }
  };

  return (
    <div className={styles.carouselContainer}>
      <div className={styles.mainWrapper}>
        {/* Contador flotante de fotos */}
        <div className={styles.counterBadge}>
          <Camera size={12} />
          <span>
            {activeIndex + 1} / {validImages.length}
          </span>
        </div>

        {/* Carrusel principal Slick */}
        <Slider ref={sliderRef} {...settings}>
          {validImages.map((src, idx) => (
            <div key={`${src}-${idx}`} className={styles.slideWrapper}>
              <img src={src} alt={`${altText} - foto ${idx + 1}`} />
            </div>
          ))}
        </Slider>
      </div>

      {/* Tira inferior de miniaturas clicables */}
      <div className={styles.thumbnailsRow}>
        {validImages.map((src, idx) => {
          const isActive = idx === activeIndex;
          return (
            <button
              key={`thumb-${src}-${idx}`}
              type="button"
              className={`${styles.thumbBtn} ${isActive ? styles['thumbBtn--active'] : ''}`}
              onClick={() => handleThumbClick(idx)}
              aria-label={`Ver foto ${idx + 1}`}
            >
              <img src={src} alt={`Miniatura ${idx + 1}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
