"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Step =
  | "name"
  | "gender"
  | "orientation"
  | "intentions"
  | "email"
  | "availability"
  | "summary"
  | "payment";

type Intention = "Friendship" | "Networking" | "Business";

type Slot = {
  start: string;
  end: string;
  originalAmount: number;
};

type Rejection = {
  id: number;
  message: string;
  eyebrow: string;
  detail?: string;
};

const maleRejections = [
  "Application denied. Vanessa’s man already has the lifetime membership—and guest passes are not included.",
  "No vacancy, sir. Vanessa’s boyfriend already bought the building.",
  "You saw ‘exclusive’ and still thought it included you. That confidence is impressive.",
  "Your application has been reviewed and respectfully launched into the sun.",
  "Vanessa’s calendar has stronger security than your dating strategy.",
  "We admire the attempt. We question the decision-making behind it.",
  "This position was filled before the website was even built.",
  "Sir, this is a booking page—not a miracle request form.",
  "The confidence was excellent. The eligibility was not.",
  "Your application has been forwarded directly to the recycling department.",
];

const romanticRejections = [
  "Romantic intentions? That confidence is doing a lot of unpaid overtime.",
  "You came looking for romance and found a rejection screen. That is called character development.",
  "Romantic intentions detected. Please redirect that optimism somewhere with vacancies.",
  "This is not a romantic comedy, and you are not the surprise ending.",
  "The audacity is complimentary. The date is not.",
  "You selected romance like Vanessa’s man was not about to read this application.",
  "Romance has left the chat—and it took your application with it.",
  "That was brave. Incorrect, but brave.",
  "Your romantic application has been denied with remarkable efficiency.",
  "Friendship was right there, and you chose chaos.",
];

const stepNumber: Record<Step, number> = {
  name: 1,
  gender: 2,
  orientation: 3,
  intentions: 4,
  email: 5,
  availability: 6,
  summary: 7,
  payment: 8,
};

function chooseOnce(messages: string[]) {
  return messages[Math.floor(Math.random() * messages.length)];
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function chicagoDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
) {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(guess));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const shownAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  return new Date(guess - (shownAsUtc - guess));
}

function demoAvailability() {
  const dateParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
  const slots: Slot[] = [];

  for (let offset = 1; offset <= 60 && slots.length < 20; offset += 1) {
    const candidate = new Date(Date.now() + offset * 86_400_000);
    const parts = Object.fromEntries(
      dateParts.formatToParts(candidate).map((part) => [part.type, part.value]),
    );
    if (!["Tue", "Thu", "Sat", "Sun"].includes(parts.weekday)) continue;
    const weekend = parts.weekday === "Sat" || parts.weekday === "Sun";

    [18, 20].forEach((hour) => {
      const start = chicagoDate(
        Number(parts.year),
        Number(parts.month),
        Number(parts.day),
        hour,
      );
      slots.push({
        start: start.toISOString(),
        end: new Date(start.getTime() + 90 * 60_000).toISOString(),
        originalAmount: weekend ? 100_000 : 50_000,
      });
    });
  }

  return slots;
}

function RejectionAnimation({
  rejection,
  onStartOver,
}: {
  rejection: Rejection;
  onStartOver: () => void;
}) {
  return (
    <div className="rejection" role="alertdialog" aria-modal="true">
      <div className="rejection__grain" />
      <div className="rejection__inner">
        <span className="rejection__icon" aria-hidden="true">
          ×
        </span>
        <div className="rejection__stamp" aria-hidden="true">
          Rejected
        </div>
        <p className="rejection__eyebrow">{rejection.eyebrow}</p>
        <h2>{rejection.message}</h2>
        {rejection.detail ? (
          <p className="rejection__detail">{rejection.detail}</p>
        ) : null}
        <p className="rejection__fineprint">
          This decision is final-ish, dramatic, and made entirely for
          entertainment.
        </p>
        <button className="button button--cream" onClick={onStartOver}>
          Start Over <span aria-hidden="true">↗</span>
        </button>
      </div>
    </div>
  );
}

function OptionButton({
  title,
  detail,
  onClick,
}: {
  title: string;
  detail?: string;
  onClick: () => void;
}) {
  return (
    <button className="option" type="button" onClick={onClick}>
      <span>
        <strong>{title}</strong>
        {detail ? <small>{detail}</small> : null}
      </span>
      <span className="option__arrow" aria-hidden="true">
        ↗
      </span>
    </button>
  );
}

function BookingExperience({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [, setGender] = useState<"Woman" | "Man" | "">("");
  const [, setOrientation] = useState("");
  const [intention, setIntention] = useState<Intention | "">("");
  const [email, setEmail] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showZelle, setShowZelle] = useState(false);
  const [rejection, setRejection] = useState<Rejection | null>(null);
  const rejectionCount = useRef(0);

  const reset = () => {
    setStep("name");
    setName("");
    setGender("");
    setOrientation("");
    setIntention("");
    setEmail("");
    setSlots([]);
    setSelectedSlot(null);
    setLoading(false);
    setError("");
    setShowZelle(false);
    setRejection(null);
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !rejection) onClose();
    };
    document.body.classList.add("modal-open");
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, rejection]);

  const reject = (message: string, eyebrow: string, detail?: string) => {
    rejectionCount.current += 1;
    setGender("");
    setOrientation("");
    setRejection({ id: rejectionCount.current, message, eyebrow, detail });
  };

  const submitName = (event: FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim().replace(/\s+/g, " ");
    if (cleanName.length < 2 || cleanName.length > 60) {
      setError("Give us a real name between 2 and 60 characters.");
      return;
    }
    setName(cleanName);
    setError("");
    setStep("gender");
  };

  const selectGender = (value: "Woman" | "Man") => {
    if (value === "Man") {
      reject(chooseOnce(maleRejections), "Application status");
      return;
    }
    setGender(value);
    setStep("orientation");
  };

  const selectOrientation = (value: string) => {
    if (value === "Lesbian") {
      reject(
        "This booking request is not eligible at this time.",
        "Application status",
        "Check back in the future for hypothetical situations.",
      );
      return;
    }
    if (value === "Prefer not to answer") {
      reject(
        "We cannot complete this highly scientific eligibility process without that answer.",
        "Eligibility inconclusive",
      );
      return;
    }
    setOrientation(value);
    setStep("intentions");
  };

  const selectIntention = (value: string) => {
    if (value === "Romantic") {
      reject(chooseOnce(romanticRejections), "Romance detected");
      return;
    }

    setError("");
    setIntention(value as Intention);
    setGender("");
    setOrientation("");
    setStep("email");
  };

  const loadAvailability = async (event: FormEvent) => {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Enter a valid email address to continue.");
      return;
    }
    setEmail(cleanEmail);
    setLoading(true);
    setError("");
    setStep("availability");
    window.setTimeout(() => {
      setSlots(demoAvailability());
      setLoading(false);
    }, 450);
  };

  const completeDemoBooking = () => {
    if (!selectedSlot || !intention) return;
    setLoading(true);
    setError("");
    const query = new URLSearchParams({
      name,
      email,
      intention,
      start: selectedSlot.start,
      end: selectedSlot.end,
      amount: String(selectedSlot.originalAmount),
    });
    window.setTimeout(() => {
      window.location.assign(`/success?${query.toString()}`);
    }, 450);
  };

  const slotGroups = useMemo(() => {
    const groups = new Map<string, Slot[]>();
    slots.forEach((slot) => {
      const key = formatDate(slot.start);
      groups.set(key, [...(groups.get(key) ?? []), slot]);
    });
    return Array.from(groups.entries());
  }, [slots]);

  if (!open) return null;

  return (
    <div className="booking-shell" role="dialog" aria-modal="true">
      <button
        className="booking-shell__backdrop"
        aria-label="Close booking experience"
        onClick={onClose}
      />
      <div className="booking-panel">
        <header className="booking-panel__header">
          <div>
            <span className="booking-panel__kicker">Private booking desk</span>
            <strong>Book Vanessa</strong>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close booking experience"
          >
            ×
          </button>
        </header>

        <div className="booking-progress" aria-label={`Step ${stepNumber[step]} of 8`}>
          <span style={{ width: `${(stepNumber[step] / 8) * 100}%` }} />
        </div>

        <div className="booking-panel__content">
          <p className="step-count">Step {stepNumber[step]} of 8</p>

          {step === "name" ? (
            <form className="booking-step" onSubmit={submitName}>
              <span className="mini-label">First things first</span>
              <h2>What should Vanessa call you?</h2>
              <p>
                Accuracy matters. Her calendar has been instructed to reject
                mysterious aliases.
              </p>
              <label className="field">
                <span>Your name</span>
                <input
                  autoFocus
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={60}
                  autoComplete="name"
                  placeholder="Enter your name"
                />
              </label>
              {error ? <p className="form-error">{error}</p> : null}
              <button className="button button--dark button--wide" type="submit">
                Continue <span aria-hidden="true">↗</span>
              </button>
            </form>
          ) : null}

          {step === "gender" ? (
            <section className="booking-step">
              <span className="mini-label">Eligibility checkpoint</span>
              <h2>How do you identify?</h2>
              <p>Choose carefully. The concierge desk is extremely literal.</p>
              <div className="option-stack">
                <OptionButton title="Woman" onClick={() => selectGender("Woman")} />
                <OptionButton title="Man" onClick={() => selectGender("Man")} />
              </div>
            </section>
          ) : null}

          {step === "orientation" ? (
            <section className="booking-step">
              <span className="mini-label">Highly scientific screening</span>
              <h2>What is your sexual orientation?</h2>
              <p>Your answer is used temporarily and is not retained.</p>
              <div className="option-stack">
                {[
                  "Straight",
                  "Bisexual",
                  "Lesbian",
                  "Prefer not to answer",
                ].map((value) => (
                  <OptionButton
                    key={value}
                    title={value}
                    onClick={() => selectOrientation(value)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {step === "intentions" ? (
            <section className="booking-step">
              <span className="mini-label">Declare your purpose</span>
              <h2>What are your intentions?</h2>
              <p>One answer opens the wrong door. The animation is excellent.</p>
              <div className="option-stack">
                {[
                  ["Friendship", "Good conversation, zero funny business"],
                  ["Romantic", "Bold selection. Potentially catastrophic"],
                  ["Networking", "Ideas, introductions, impressive nouns"],
                  ["Business", "Professional, polished, probably tax-deductible"],
                ].map(([title, detail]) => (
                  <OptionButton
                    key={title}
                    title={title}
                    detail={detail}
                    onClick={() => selectIntention(title)}
                  />
                ))}
              </div>
              {loading ? <p className="status-line">Consulting the velvet rope…</p> : null}
              {error ? <p className="form-error">{error}</p> : null}
            </section>
          ) : null}

          {step === "email" ? (
            <form className="booking-step" onSubmit={loadAvailability}>
              <span className="mini-label">You passed</span>
              <h2>Where should we send the invitation?</h2>
              <p>
                This demo keeps your email only in the current browser flow.
              </p>
              <label className="field">
                <span>Email address</span>
                <input
                  autoFocus
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </label>
              {error ? <p className="form-error">{error}</p> : null}
              <button
                className="button button--dark button--wide"
                type="submit"
                disabled={loading}
              >
                {loading ? "Opening the calendar…" : "View Availability"}
                <span aria-hidden="true">↗</span>
              </button>
            </form>
          ) : null}

          {step === "availability" ? (
            <section className="booking-step booking-step--calendar">
              <span className="mini-label">90 minutes · Central Time</span>
              <h2>Choose your opening.</h2>
              <p>
                These sample openings demonstrate the experience without
                connecting to anyone’s real calendar.
              </p>
              {loading ? (
                <div className="calendar-loading" aria-live="polite">
                  <span /> <span /> <span />
                  <p>Checking the next 60 days…</p>
                </div>
              ) : null}
              {!loading && error ? (
                <div className="calendar-state">
                  <strong>Demo calendar unavailable</strong>
                  <p>{error}</p>
                  <button
                    className="text-button"
                    onClick={() => {
                      setStep("email");
                      setError("");
                    }}
                  >
                    Go back
                  </button>
                </div>
              ) : null}
              {!loading && !error && slotGroups.length === 0 ? (
                <div className="calendar-state">
                  <strong>No openings right now</strong>
                  <p>
                    Vanessa’s calendar is giving “fully booked.” Check again
                    later.
                  </p>
                </div>
              ) : null}
              {!loading && !error ? (
                <div className="slot-list">
                  {slotGroups.slice(0, 14).map(([date, dateSlots]) => (
                    <div className="slot-day" key={date}>
                      <div>
                        <strong>{date}</strong>
                        <small>
                          {money(dateSlots[0].originalAmount)} experience
                        </small>
                      </div>
                      <div className="slot-day__times">
                        {dateSlots.map((slot) => (
                          <button
                            key={slot.start}
                            onClick={() => {
                              setSelectedSlot(slot);
                              setStep("summary");
                            }}
                          >
                            {formatTime(slot.start)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          {step === "summary" && selectedSlot ? (
            <section className="booking-step">
              <span className="mini-label">Review your request</span>
              <h2>Excellent choice, {name.split(" ")[0]}.</h2>
              <p>One final look before the velvet rope lifts.</p>
              <dl className="summary-card">
                <div>
                  <dt>Guest</dt>
                  <dd>{name}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{email}</dd>
                </div>
                <div>
                  <dt>Intention</dt>
                  <dd>{intention}</dd>
                </div>
                <div>
                  <dt>Date</dt>
                  <dd>{formatDate(selectedSlot.start)}</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>
                    {formatTime(selectedSlot.start)}–{formatTime(selectedSlot.end)} CT
                  </dd>
                </div>
                <div className="summary-card__total">
                  <dt>Original price</dt>
                  <dd>{money(selectedSlot.originalAmount)}</dd>
                </div>
              </dl>
              <button
                className="button button--dark button--wide"
                onClick={() => setStep("payment")}
              >
                Choose Payment <span aria-hidden="true">↗</span>
              </button>
              <button className="text-button" onClick={() => setStep("availability")}>
                Choose another time
              </button>
            </section>
          ) : null}

          {step === "payment" && selectedSlot ? (
            <section className="booking-step">
              <span className="mini-label">Final step</span>
              <h2>{showZelle ? "Zelle demonstration" : "Complete the demo."}</h2>
              {!showZelle ? (
                <>
                  <p>
                    No payment is collected. Choose the demo checkout to see
                    the confirmation experience.
                  </p>
                  <div className="payment-stack">
                    <button className="payment-card" onClick={completeDemoBooking}>
                      <span className="payment-card__mark">S</span>
                      <span>
                        <strong>Demo Checkout</strong>
                        <small>No card, account, or payment required</small>
                      </span>
                      <b>{money(selectedSlot.originalAmount)}</b>
                    </button>
                    <button className="payment-card" onClick={() => setShowZelle(true)}>
                      <span className="payment-card__mark payment-card__mark--purple">Z</span>
                      <span>
                        <strong>Zelle Example</strong>
                        <small>Visual demonstration only</small>
                      </span>
                      <b>Demo</b>
                    </button>
                  </div>
                  <div className="test-badge test-badge--panel">
                    <span /> Demo — No Payment
                  </div>
                </>
              ) : (
                <div className="zelle-demo">
                  <span className="zelle-demo__logo">Z</span>
                  <strong>Demo only—do not send money.</strong>
                  <p>
                    No real recipient, phone number, email, or QR code is shown.
                    This option does not reserve time, collect money, or create
                    a calendar event.
                  </p>
                  <div className="zelle-demo__fake-row">
                    <span>Recipient</span>
                    <b>Demonstration only</b>
                  </div>
                  <div className="zelle-demo__fake-row">
                    <span>Amount</span>
                    <b>{money(selectedSlot.originalAmount)}</b>
                  </div>
                  <button
                    className="button button--dark button--wide"
                    onClick={completeDemoBooking}
                  >
                    Complete Demo Booking
                  </button>
                </div>
              )}
              {loading ? <p className="status-line">Preparing the grand finale…</p> : null}
              {error ? <p className="form-error">{error}</p> : null}
            </section>
          ) : null}
        </div>

        <footer className="booking-panel__footer">
          <span className="privacy-dot" /> Demo answers stay in this browser and
          are not sent anywhere.
        </footer>

        {rejection ? (
          <RejectionAnimation rejection={rejection} onStartOver={reset} />
        ) : null}
      </div>
    </div>
  );
}

const gallery = [
  {
    src: "/vanessa/vanessa-lifestyle-city.jpg",
    alt: "Vanessa smiling outdoors in a white lace outfit",
    className: "gallery-card gallery-card--lead",
  },
  {
    src: "/vanessa/vanessa-lifestyle-guitar.jpg",
    alt: "Vanessa relaxing on a sofa while holding a guitar",
    className: "gallery-card gallery-card--feature",
  },
  {
    src: "/vanessa/vanessa-portrait-beanie.jpg",
    alt: "Vanessa wearing a neutral knit beanie",
    className: "gallery-card gallery-card--beanie",
  },
  {
    src: "/vanessa/vanessa-lifestyle-luxury.jpg",
    alt: "Vanessa in a white lace outfit during a city outing",
    className: "gallery-card gallery-card--luxury",
  },
  {
    src: "/vanessa/vanessa-portrait-editorial.jpg",
    alt: "Editorial close-up portrait of Vanessa",
    className: "gallery-card gallery-card--editorial",
  },
];

export default function Home() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [checkoutCanceled, setCheckoutCanceled] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("booking") !== "canceled") {
      return;
    }
    const timer = window.setTimeout(() => setCheckoutCanceled(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main>
      <div className="announcement">
        <span>Private entertainment demo</span>
        <span aria-hidden="true">✦</span>
        <span>Exclusivity is mostly theatrical</span>
      </div>

      {checkoutCanceled ? (
        <div className="checkout-canceled" role="status">
          <span>The demo checkout was canceled. Nothing was reserved.</span>
          <button onClick={() => setCheckoutCanceled(false)} aria-label="Dismiss canceled checkout message">×</button>
        </div>
      ) : null}

      <nav className="nav shell" aria-label="Primary navigation">
        <a className="wordmark" href="#top" aria-label="Book Vanessa home">
          Book <em>Vanessa</em>
        </a>
        <div className="nav__actions">
          <div className="test-badge"><span /> Fully Local Demo</div>
          <a
            className="instagram-link"
            href="https://www.instagram.com/vivalabeautywax"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram <span aria-hidden="true">↗</span>
          </a>
        </div>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero__copy">
          <div className="eyebrow"><span /> By application only</div>
          <h1>
            Book Vanessa.
            <em>If You Qualify.</em>
          </h1>
          <p className="hero__subhead">
            A highly exclusive, questionably serious concierge experience.
          </p>
          <button
            className="button button--dark button--hero"
            onClick={() => setBookingOpen(true)}
          >
            Check My Eligibility <span aria-hidden="true">↗</span>
          </button>
          <p className="hero__aside">
            <span aria-hidden="true">✦</span> Availability is limited. Standards
            are unnecessarily high.
          </p>
        </div>
        <div className="hero__portrait">
          <Image
            src="/vanessa/vanessa-hero.jpg"
            alt="Vanessa smiling in an elegant floral outfit"
            fill
            unoptimized
            priority
            sizes="(max-width: 760px) 92vw, 48vw"
          />
          <div className="hero__seal" aria-hidden="true">
            <span>Rare</span>
            <b>✦</b>
            <span>Energy</span>
          </div>
          <div className="hero__caption">
            <span>Currently accepting</span>
            <strong>Qualified applications</strong>
          </div>
        </div>
      </section>

      <div className="marquee" aria-hidden="true">
        <div>
          <span>Premium energy</span><b>✦</b><span>Elite conversation</span><b>✦</b>
          <span>Zero guarantees</span><b>✦</b><span>Exceptional standards</span><b>✦</b>
          <span>Premium energy</span><b>✦</b><span>Elite conversation</span><b>✦</b>
        </div>
      </div>

      <section className="meet shell section" id="meet">
        <div className="meet__image image-frame">
          <Image
            src="/vanessa/vanessa-portrait-evening.jpg"
            alt="Portrait of Vanessa with long dark hair"
            fill
            unoptimized
            sizes="(max-width: 760px) 92vw, 40vw"
          />
          <span className="image-frame__note">Not your average calendar invite</span>
        </div>
        <div className="meet__copy">
          <span className="section-number">01 / Meet Vanessa</span>
          <h2>Some people have free time. Vanessa has <em>inventory.</em></h2>
          <p>
            Entrepreneur, beauty expert, professional vibe curator, and a woman
            whose calendar does not accept just anybody. Vanessa’s time is
            valuable, highly requested, and now dramatically overpriced for
            entertainment purposes.
          </p>
          <div className="signature">Vanessa</div>
          <a
            className="text-link"
            href="https://www.instagram.com/vivalabeautywax"
            target="_blank"
            rel="noopener noreferrer"
          >
            Meet the real Vanessa on Instagram <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <section className="premium section">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="section-number section-number--light">02 / The value</span>
              <h2>Why Vanessa’s time is premium</h2>
            </div>
            <p>Ordinary scheduling was considered. It did not make the cut.</p>
          </div>
          <div className="premium-grid">
            <article>
              <span>01</span><b aria-hidden="true">“</b>
              <h3>Elite Conversation</h3>
              <p>Stories, opinions, and exactly the right amount of judgment.</p>
            </article>
            <article>
              <span>02</span><b aria-hidden="true">✦</b>
              <h3>Premium Energy</h3>
              <p>The atmosphere improves. Science is still investigating.</p>
            </article>
            <article>
              <span>03</span><b aria-hidden="true">◷</b>
              <h3>Extremely Limited</h3>
              <p>There are only so many 90-minute windows worth opening.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="gallery section shell">
        <div className="section-heading section-heading--dark">
          <div>
            <span className="section-number">03 / The evidence</span>
            <h2>Premium, in several settings.</h2>
          </div>
          <p>A carefully curated glimpse. The full archive requires clearance.</p>
        </div>
        <div className="gallery-grid">
          {gallery.map((image) => (
            <figure className={image.className} key={image.src}>
              <Image
                src={image.src}
                alt={image.alt}
                fill
                unoptimized
                sizes="(max-width: 700px) 94vw, (max-width: 1100px) 42vw, 48vw"
              />
            </figure>
          ))}
        </div>
      </section>

      <section className="pricing section" id="pricing">
        <div className="shell pricing__inner">
          <div className="pricing__intro">
            <span className="section-number">04 / The investment</span>
            <h2>Choose your level of unnecessary luxury.</h2>
            <p>
              Demand-based pricing, because Vanessa’s weekends are premium
              inventory.
            </p>
            <div className="pricing__hours">
              <span>Booking hours</span>
              <strong>6:00–10:00 PM CT</strong>
              <small>90-minute experiences · Up to 60 days ahead</small>
            </div>
          </div>
          <div className="price-cards">
            <article className="price-card">
              <span>Monday–Friday</span>
              <h3>Weekday Experience</h3>
              <div><sup>$</sup><b>500</b></div>
              <p>For people who make bold choices on responsible days.</p>
              <button onClick={() => setBookingOpen(true)}>Apply for a weekday <span>↗</span></button>
            </article>
            <article className="price-card price-card--featured">
              <div className="price-card__ribbon">Premium inventory</div>
              <span>Saturday–Sunday</span>
              <h3>Weekend Experience</h3>
              <div><sup>$</sup><b>1,000</b></div>
              <p>Same Vanessa. More expensive calendar real estate.</p>
              <button onClick={() => setBookingOpen(true)}>Apply for a weekend <span>↗</span></button>
            </article>
          </div>
        </div>
      </section>

      <section className="process section shell">
        <div className="section-heading section-heading--dark">
          <div>
            <span className="section-number">05 / The process</span>
            <h2>Simple. Unless you get rejected.</h2>
          </div>
          <button className="button button--outline" onClick={() => setBookingOpen(true)}>
            Begin Application <span aria-hidden="true">↗</span>
          </button>
        </div>
        <ol className="process-list">
          {[
            ["01", "Pass the eligibility check", "A few questions. A surprisingly high emotional risk."],
            ["02", "State your intentions", "Choose friendship, networking, or business wisely."],
            ["03", "Select a sample time", "Choose from playful demo availability for the next 60 days."],
            ["04", "Complete demo checkout", "No card, account, or real payment is required."],
            ["05", "Receive confirmation", "The digital velvet rope lifts entirely in your browser."],
          ].map(([number, title, detail]) => (
            <li key={number}>
              <span>{number}</span><strong>{title}</strong><p>{detail}</p><b aria-hidden="true">↗</b>
            </li>
          ))}
        </ol>
      </section>

      <section className="instagram section shell">
        <div className="instagram__image">
          <Image
            src="/vanessa/vanessa-portrait-soft.jpg"
            alt="Vanessa smiling in a polished portrait"
            fill
            unoptimized
            sizes="(max-width: 760px) 92vw, 45vw"
          />
        </div>
        <div className="instagram__copy">
          <span className="instagram__icon" aria-hidden="true">◎</span>
          <span className="section-number">Follow Vanessa on Instagram</span>
          <h2>@vivalabeautywax</h2>
          <p>Beauty expertise, entrepreneurial energy, and occasional evidence that she leaves the office.</p>
          <a
            className="button button--cream"
            href="https://www.instagram.com/vivalabeautywax"
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit Instagram <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <section className="final-cta">
        <div className="shell final-cta__inner">
          <span className="eyebrow eyebrow--center"><span /> One question remains</span>
          <h2>Do you qualify?</h2>
          <p>There is only one dignified way to find out.</p>
          <button className="button button--dark button--hero" onClick={() => setBookingOpen(true)}>
            Check My Eligibility <span aria-hidden="true">↗</span>
          </button>
        </div>
      </section>

      <footer className="footer">
        <div className="shell footer__top">
          <a className="wordmark wordmark--footer" href="#top">Book <em>Vanessa</em></a>
          <p>
            This website is a private entertainment demo. It does not offer dating,
            escort, adult, or sexual services. No payment is collected, and the
            booking flow is a browser-only demonstration.
          </p>
        </div>
        <div className="shell footer__bottom">
          <span>Screening answers are used temporarily in your browser and are not sent or retained.</span>
          <a href="https://www.instagram.com/vivalabeautywax" target="_blank" rel="noopener noreferrer">@vivalabeautywax ↗</a>
        </div>
      </footer>

      <BookingExperience open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </main>
  );
}
