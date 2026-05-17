import { useEffect } from "react";
import { useProgress } from "../lib/progress/useProgress";

export default function TrackVisit({ slug }: { slug: string }) {
  const { setLastVisited } = useProgress();
  useEffect(() => {
    setLastVisited(slug);
  }, [slug, setLastVisited]);
  return null;
}
