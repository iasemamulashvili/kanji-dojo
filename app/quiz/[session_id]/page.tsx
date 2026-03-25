import QuizClient from "@/components/quiz/QuizClient";

interface PageProps {
  params: Promise<{ session_id: string }>;
}

export default async function QuizPage({ params }: PageProps) {
  const { session_id } = await params;
  return <QuizClient sessionId={session_id} />;
}
