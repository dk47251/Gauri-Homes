"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { money, whatsappNumber } from "@/lib/format";

export function WhatsAppReminder({
  owner,
  phone,
  pending,
  month,
  dueDate,
}: {
  owner: string;
  phone: string;
  pending: number;
  month: string;
  dueDate: string;
}) {
  const send = () => {
    const n = whatsappNumber(phone);
    if (!n) {
      alert("WhatsApp/Mobile number is missing for this member.");
      return;
    }
    const msg = [
      `Hello ${owner},`,
      `This is a reminder from ${APP_NAME}.`,
      `Your maintenance pending amount is ${money(pending)} for ${month}.`,
      `Due Date: ${dueDate || "As per society schedule"}`,
      "Please make the payment at your earliest convenience.",
      "Thank you.",
    ].join("\n");
    window.open(`https://wa.me/${n}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <Button variant="primary" onClick={send}>
      <MessageCircle size={15} />
      Send Reminder
    </Button>
  );
}
