"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase-client";

const contactSchema = z.object({
  name: z.string().min(1, "שדה חובה"),
  email: z.string().min(1, "שדה חובה").email("כתובת אימייל לא תקינה"),
  phone: z.string().min(1, "שדה חובה"),
  subject: z.string().min(1, "שדה חובה"),
  message: z.string().min(1, "שדה חובה"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const EMPTY_VALUES: ContactFormValues = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: EMPTY_VALUES,
  });

  async function submit(values: ContactFormValues) {
    const { error } = await supabase.from("inquiries").insert(values);
    if (error) {
      toast.error("משהו השתבש, נסו שוב");
      return;
    }
    toast.success("הפנייה נשלחה בהצלחה, נחזור אליכם בהקדם");
    reset(EMPTY_VALUES);
  }

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>צור קשר</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact-name">שם</Label>
              <Input id="contact-name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contact-email">אימייל</Label>
                <Input id="contact-email" type="email" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-phone">טלפון</Label>
                <Input id="contact-phone" type="tel" {...register("phone")} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-subject">נושא</Label>
              <Input id="contact-subject" {...register("subject")} />
              {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-message">הודעה</Label>
              <Textarea id="contact-message" rows={5} {...register("message")} />
              {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
            </div>

            <Button type="submit" disabled={isSubmitting} className="self-start">
              שליחת פנייה
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
