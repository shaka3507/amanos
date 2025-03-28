import React from 'react';
import { DashboardNav } from '@/components/dashboard-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FAQPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <DashboardNav user={null} />
      <main className="flex-1">
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-3xl font-medium mb-8">Frequently Asked Questions</h1>
          <div className="space-y-4">
            <Card className="bg-blue-100 border-2 border-black shadow-lg">
              <CardHeader>
                <CardTitle>What is this application about?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">This application is designed to help users manage alerts and crisis situations effectively.</p>
              </CardContent>
            </Card>
            <Card className="bg-green-100 border-2 border-black shadow-lg">
              <CardHeader>
                <CardTitle>How do I create an alert?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">You can create an alert by navigating to the 'Create Alert' section and filling out the necessary details.</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-100 border-2 border-black shadow-lg">
              <CardHeader>
                <CardTitle>Who can I contact for support?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">For support, please reach out to our support team via the 'Contact Us' page.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FAQPage;