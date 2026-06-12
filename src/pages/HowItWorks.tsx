import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { queueScrollToHowItWorks } from "@/lib/smoothScroll";

/** Legacy route — scrolls to homepage #how-it-works section */
const HowItWorks = () => {
  const navigate = useNavigate();

  useEffect(() => {
    queueScrollToHowItWorks();
    navigate("/", { replace: true });
  }, [navigate]);

  return null;
};

export default HowItWorks;
