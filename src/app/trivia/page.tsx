import { getTrivia } from "@/lib/data";
import { TriviaGame } from "@/components/trivia-game";
import { Banderitas, StringLights } from "@/components/decor";

export const dynamic = "force-dynamic";

export default async function TriviaPage() {
  const questions = await getTrivia();

  return (
    <main className="flex-1">
      <section className="bg-gradient-to-b from-navy-deep to-navy text-cream">
        <Banderitas className="px-2 pt-3" />
        <div className="mx-auto max-w-2xl px-6 pb-8 pt-8 text-center">
          <h1 className="font-display text-4xl font-extrabold sm:text-5xl">
            Filipino Food Trivia
          </h1>
          <p className="mt-2 text-cream/85">
            Ten bites of food knowledge. How many can you get?
          </p>
        </div>
        <StringLights />
      </section>

      <div className="px-6 py-12">
        <TriviaGame questions={questions} />
      </div>
    </main>
  );
}
