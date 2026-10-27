import Respondent from "@/app/components/Respondent";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <Respondent roomId={(await params).id} />; }
