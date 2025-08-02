import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Mail, Phone, Search } from "lucide-react"

export default function HelpPage() {
  const faqs = [
    {
      question: "How do I create a ride posting?",
      answer:
        "To create a ride posting, go to the Rides page and click 'Create Ride'. Fill out the form with your departure location, destination, date, time, available seats, and suggested contribution. Your ride will be visible to other students immediately.",
    },

    {
      question: "Is it safe to share my contact information?",
      answer:
        "Your contact information is only shared with users who express interest in your posts. We recommend meeting in public places and trusting your instincts when connecting with new people.",
    },
    {
      question: "How do I cancel a ride posting?",
      answer:
        "You can cancel your postings by going to your profile page, finding the posting under 'My Rides', and clicking the delete button. All interested users will be notified of the cancellation.",
    },
    {
      question: "What should I do if someone doesn't show up for a ride?",
      answer:
        "If someone doesn't show up, you can report the issue to support. Repeated no-shows may result in account restrictions. Always have backup plans and communicate clearly about meeting times and locations.",
    },
    {
      question: "How do I report inappropriate behavior?",
      answer:
        "If you encounter inappropriate behavior, please contact our support team immediately at support@campusshare.com or use the report feature in the app. We take safety seriously and will investigate all reports.",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-xl text-gray-600">Find answers to common questions and get support</p>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input placeholder="Search for help topics..." className="pl-10 text-lg h-12" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <MessageCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
              <p className="text-gray-600 mb-4">Get instant help from our support team</p>
              <Button className="w-full">Start Chat</Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <Mail className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Email Support</h3>
              <p className="text-gray-600 mb-4">Send us a detailed message</p>
              <Button variant="outline" className="w-full bg-transparent">
                Send Email
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <Phone className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Phone Support</h3>
              <p className="text-gray-600 mb-4">Call us during business hours</p>
              <Button variant="outline" className="w-full bg-transparent">
                Call Now
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>Find quick answers to common questions</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-gray-600">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-semibold mb-4">Still need help?</h2>
          <p className="text-gray-600 mb-6">Our support team is available Monday-Friday, 9 AM - 6 PM EST</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">
              <MessageCircle className="w-5 h-5 mr-2" />
              Contact Support
            </Button>
            <Button variant="outline" size="lg" className="bg-transparent">
              <Mail className="w-5 h-5 mr-2" />
              support@campusshare.com
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
