import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.25),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_28%),linear-gradient(to_bottom,#020617,#0f172a,#020617)]" />
      <div className="absolute left-[-120px] top-[80px] -z-10 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute bottom-[-120px] right-[-80px] -z-10 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 md:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-slate-200 backdrop-blur">
              Холбоо барих
            </div>

            <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl md:text-6xl">
              Бидэнтэй
              <span className="block bg-gradient-to-r from-lime-300 to-emerald-400 bg-clip-text text-transparent">
                холбогдоорой
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base md:text-lg">
              Доорх сувгуудаар бидэнтэй шууд холбогдож, асуулт хариулт, хамтын
              ажиллагаа болон үйлчилгээний мэдээллээ аваарай.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-white/10"
          >
            ← Нүүр хуудас
          </Link>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-xl sm:rounded-[32px] sm:p-6 md:p-8">
            <div className="mb-8">
              <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                Шууд холбоо
              </div>
              <h2 className="mt-4 text-2xl font-bold md:text-3xl">
                Танд туслахад бэлэн
              </h2>
              <p className="mt-3 text-sm text-slate-400 sm:text-base">
                Утас, хаяг болон сошиал сувгуудаар хүссэн үедээ холбогдоорой.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <a
                href="tel:72237326"
                className="group rounded-3xl border border-white/10 bg-slate-900/70 p-5 transition hover:border-emerald-400/30 hover:bg-white/10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-xl">
                  📞
                </div>
                <div className="mt-4 text-sm text-slate-400">Утасны дугаар</div>
                <div className="mt-2 text-xl font-semibold text-white">
                  72237326
                </div>
                <div className="mt-2 text-sm text-emerald-300">
                  Шууд залгах
                </div>
              </a>

              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-400/10 text-xl">
                  📍
                </div>
                <div className="mt-4 text-sm text-slate-400">Хаяг</div>
                <div className="mt-2 text-xl font-semibold text-white">
                  Улаанбаатар хот
                </div>
                <div className="mt-2 text-sm text-slate-300">Монгол улс</div>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-indigo-400/20 bg-indigo-400/10 p-5 sm:rounded-[28px]">
              <div className="mt-2 text-2xl font-bold text-white">
                Хурдан хариу авахыг хүсвэл
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-200">
                facebook чат бичих болон бидэн руу залгаарай.
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-xl sm:rounded-[32px] sm:p-6 md:p-8">
            <div className="mb-8">
              <div className="inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-300">
                Сошиал сувгууд
              </div>
              <h2 className="mt-4 text-2xl font-bold md:text-3xl">
                Биднийг дагаарай
              </h2>
              <p className="mt-3 text-sm text-slate-400 sm:text-base">
                Контент, шинэ мэдээлэл болон бүтээлүүдээ сошиал хуудсаараа
                тогтмол хүргэдэг.
              </p>
            </div>

            <div className="grid gap-4">
              <a
                href="https://www.facebook.com/profile.php?id=61585410502029"
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-3xl border border-sky-400/25 bg-sky-400/10 p-5 transition hover:-translate-y-1 hover:bg-sky-400/15"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm text-sky-200">Facebook page</div>
                    <div className="mt-2 text-xl font-semibold text-white">
                      Shine studio
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      Манай page-ээр дамжуулж бидэнтэй шууд холбогдоорой.
                    </p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl">
                    f
                  </div>
                </div>
              </a>

              <a
                href="https://instagram.com/1shineacademy"
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-3xl border border-pink-400/25 bg-pink-400/10 p-5 transition hover:-translate-y-1 hover:bg-pink-400/15"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm text-pink-200">Instagram</div>
                    <div className="mt-2 text-xl font-semibold text-white">
                      1shineacademy
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      Сургалт, бүтээл болон шинэ постуудаа эндээс үзээрэй.
                    </p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl">
                    ◎
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
