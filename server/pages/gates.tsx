import type { Link } from "@prisma/client";
import { PUBLIC_CSS, renderDocument, type Locale } from "./render";

const STRINGS = {
  id: {
    notFoundTitle: "Tautan tidak ditemukan",
    notFoundBody: "Alamat ini belum dipakai atau sudah dihapus oleh pemiliknya.",
    disabledTitle: "Tautan dinonaktifkan",
    disabledBody: "Pemilik tautan ini menghentikan akses sementara.",
    scheduledTitle: "Tautan belum aktif",
    scheduledBody: "Tautan ini mulai aktif pada",
    expiredTitle: "Tautan sudah kedaluwarsa",
    expiredBody: "Masa berlaku tautan ini sudah berakhir.",
    protectedTitle: "Tautan ini dilindungi",
    protectedBody: "Masukkan kata sandi dari pemilik tautan untuk melanjutkan.",
    passwordLabel: "Kata sandi",
    passwordWrong: "Kata sandi salah. Coba lagi.",
    passwordSubmit: "Buka tautan",
    destination: "Tujuan",
    continue: "Lanjut ke tujuan",
    portalFallback: "Anda akan diarahkan ke situs di bawah ini.",
    home: "Dibuat dengan Linkly",
    tooMany: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.",
  },
  en: {
    notFoundTitle: "Link not found",
    notFoundBody: "This address is unused or the owner has deleted it.",
    disabledTitle: "Link turned off",
    disabledBody: "The owner has paused access to this link.",
    scheduledTitle: "Link not active yet",
    scheduledBody: "This link becomes active on",
    expiredTitle: "Link expired",
    expiredBody: "This link is no longer valid.",
    protectedTitle: "This link is protected",
    protectedBody: "Enter the password the link owner gave you to continue.",
    passwordLabel: "Password",
    passwordWrong: "Wrong password. Try again.",
    passwordSubmit: "Open link",
    destination: "Destination",
    continue: "Continue to destination",
    portalFallback: "You are about to be sent to the site below.",
    home: "Made with Linkly",
    tooMany: "Too many attempts. Try again in a few minutes.",
  },
} as const;

function Shell({ lang, children }: { lang: Locale; children: React.ReactNode }) {
  return (
    <main className="card">
      {children}
      <p className="foot">
        <a href="/">{STRINGS[lang].home}</a>
      </p>
    </main>
  );
}

function Message({ lang, title, body, slug }: { lang: Locale; title: string; body: string; slug?: string }) {
  return (
    <Shell lang={lang}>
      <div className="stack">
        {slug ? (
          <span className="code">
            <b>/</b>
            {slug}
          </span>
        ) : null}
        <h1>{title}</h1>
        <p>{body}</p>
      </div>
    </Shell>
  );
}

function page(lang: Locale, title: string, body: React.ReactNode) {
  return renderDocument({ title: `${title} · Linkly`, lang, css: PUBLIC_CSS, body, noindex: true });
}

export function notFoundPage(lang: Locale, slug?: string) {
  const s = STRINGS[lang];
  return page(lang, s.notFoundTitle, <Message lang={lang} title={s.notFoundTitle} body={s.notFoundBody} slug={slug} />);
}

export function disabledPage(lang: Locale, slug: string) {
  const s = STRINGS[lang];
  return page(lang, s.disabledTitle, <Message lang={lang} title={s.disabledTitle} body={s.disabledBody} slug={slug} />);
}

export function scheduledPage(lang: Locale, slug: string, startsAt: Date) {
  const s = STRINGS[lang];
  const when = new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-US", { dateStyle: "full", timeStyle: "short", timeZone: "UTC" }).format(startsAt);
  return page(lang, s.scheduledTitle, <Message lang={lang} title={s.scheduledTitle} body={`${s.scheduledBody} ${when} UTC.`} slug={slug} />);
}

export function expiredPage(lang: Locale, slug: string) {
  const s = STRINGS[lang];
  return page(lang, s.expiredTitle, <Message lang={lang} title={s.expiredTitle} body={s.expiredBody} slug={slug} />);
}

export function passwordPage(lang: Locale, slug: string, state: "idle" | "wrong" | "limited") {
  const s = STRINGS[lang];
  return page(
    lang,
    s.protectedTitle,
    <Shell lang={lang}>
      <div className="stack">
        <span className="code">
          <b>/</b>
          {slug}
        </span>
        <h1>{s.protectedTitle}</h1>
        <p>{s.protectedBody}</p>
      </div>
      {state === "wrong" ? <div className="alert" role="alert">{s.passwordWrong}</div> : null}
      {state === "limited" ? <div className="alert" role="alert">{s.tooMany}</div> : null}
      <form method="post" action={`/${slug}/unlock`} className="stack">
        <label htmlFor="password">{s.passwordLabel}</label>
        <input id="password" name="password" type="password" required autoFocus autoComplete="off" maxLength={72} />
        <button className="btn" type="submit" style={{ marginTop: 8 }}>
          {s.passwordSubmit}
        </button>
      </form>
    </Shell>,
  );
}

export function landingPage(lang: Locale, link: Pick<Link, "slug" | "title" | "originalUrl" | "landingDescription" | "landingImageUrl">) {
  const s = STRINGS[lang];
  const host = new URL(link.originalUrl).hostname.replace(/^www\./, "");
  return page(
    lang,
    link.title,
    <Shell lang={lang}>
      <div className="stack">
        {link.landingImageUrl ? <img className="media" src={link.landingImageUrl} alt="" width={64} height={64} /> : null}
        <h1>{link.title}</h1>
        <p>{link.landingDescription || s.portalFallback}</p>
      </div>
      <div className="dest">
        <small>{s.destination}</small>
        <span>{host}</span>
      </div>
      <a className="btn" href={link.originalUrl} rel="noopener noreferrer">
        {s.continue}
      </a>
    </Shell>,
  );
}
