"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Confirmation = {
  name: string;
  email: string;
  intention: string;
  caseText: string;
  start: string;
  end: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
};

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function date(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function time(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function SuccessPage() {
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const values = {
      name: params.get("name") ?? "",
      email: params.get("email") ?? "",
      intention: params.get("intention") ?? "",
      caseText: params.get("case") ?? "",
      start: params.get("start") ?? "",
      end: params.get("end") ?? "",
      originalAmount: Number(params.get("originalAmount") ?? 0),
      discountAmount: Number(params.get("discountAmount") ?? 0),
      finalAmount: Number(params.get("finalAmount") ?? 0),
    };

    const validDate = values.start && values.end
      && !Number.isNaN(new Date(values.start).getTime())
      && !Number.isNaN(new Date(values.end).getTime());

    const timer = window.setTimeout(() => {
      if (
        !values.name ||
        !values.email ||
        !values.intention ||
        !values.caseText ||
        !validDate
      ) {
        setError("Start a booking first so the velvet rope knows who you are.");
        return;
      }
      setConfirmation(values);
    }, 500);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="success-page">
      <div className="success-page__confetti" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => (
          <i key={index} style={{ "--piece": index } as React.CSSProperties} />
        ))}
      </div>
      <Link className="wordmark success-page__wordmark" href="/">
        Book <em>Vanessa</em>
      </Link>

      {!confirmation && !error ? (
        <section className="success-loading" aria-live="polite">
          <span>✦</span>
          <h1>Confirming your booking…</h1>
          <p>The digital velvet rope is lifting.</p>
        </section>
      ) : null}

      {error ? (
        <section className="success-error">
          <span>Booking confirmation</span>
          <h1>We need you back at the velvet rope.</h1>
          <p>{error}</p>
          <Link className="button button--dark" href="/">Return to Book Vanessa</Link>
        </section>
      ) : null}

      {confirmation ? (
        <section className="confirmation-card">
          <div className="confirmation-card__image">
            <Image
              src="/vanessa/vanessa-portrait-beanie.jpg"
              alt="Vanessa smiling in a relaxed portrait"
              fill
              unoptimized
              priority
              sizes="(max-width: 760px) 100vw, 45vw"
            />
            <div className="confirmation-card__seal">Confirmed <span>✦</span></div>
          </div>
          <div className="confirmation-card__content">
            <span className="mini-label">The application succeeded</span>
            <h1>Booking Confirmed</h1>
            <p className="confirmation-card__lead">
              Congratulations, {confirmation.name.split(" ")[0]}. Vanessa’s
              calendar has officially acknowledged your existence.
            </p>
            <dl className="summary-card confirmation-card__summary">
              <div><dt>Guest</dt><dd>{confirmation.name}</dd></div>
              <div><dt>Email</dt><dd>{confirmation.email}</dd></div>
              <div><dt>Intention</dt><dd>{confirmation.intention}</dd></div>
              <div className="summary-card__case"><dt>Your case</dt><dd>{confirmation.caseText}</dd></div>
              <div><dt>Date</dt><dd>{date(confirmation.start)}</dd></div>
              <div><dt>Time</dt><dd>{time(confirmation.start)}–{time(confirmation.end)} CT</dd></div>
              <div><dt>Booking price</dt><dd>{money(confirmation.originalAmount)}</dd></div>
              {confirmation.discountAmount > 0 ? (
                <div><dt>Promotion</dt><dd>−{money(confirmation.discountAmount)}</dd></div>
              ) : null}
              <div className="summary-card__total"><dt>Total</dt><dd>{money(confirmation.finalAmount)}</dd></div>
            </dl>
            {confirmation.finalAmount === 0 ? (
              <div className="complimentary-status"><span>✦</span> Complimentary booking confirmed</div>
            ) : null}
            <div className="calendar-status calendar-status--added">
              <span /> Booking request received — Vanessa will review the final details
            </div>
            <div className="confirmation-card__actions">
              <a className="button button--dark" href="https://www.instagram.com/vivalabeautywax" target="_blank" rel="noopener noreferrer">Visit Instagram ↗</a>
              <Link className="text-button" href="/">Return home</Link>
            </div>
          </div>
        </section>
      ) : null}

      <p className="success-page__disclaimer">
        Book Vanessa · By application only
      </p>
    </main>
  );
}
