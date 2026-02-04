import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Shield, Activity, Users, Database, Lock } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">LifeLink TrustChain</h1>
          </div>

          {/* 🔐 Auth Buttons */}
          <div className="flex gap-3">
            <Link to="/signin">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-5xl font-bold tracking-tight">
            Blockchain-Powered Organ Donation Network
          </h2>
          <p className="text-xl text-muted-foreground">
            A transparent, secure, and efficient platform connecting donors, recipients, and hospitals through decentralized technology.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link to="/dashboard">
              {/* <Button size="lg" className="text-lg">
                Enter Dashboard
              </Button> */}
            </Link>
            <Link to="/signin">
              <Button size="lg" variant="outline" className="text-lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center mb-12">Key Features</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardContent className="pt-6">
              <Shield className="h-12 w-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Blockchain Security</h4>
              <p className="text-muted-foreground">
                Immutable records ensure transparency and prevent fraud in the donation process.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardContent className="pt-6">
              <Activity className="h-12 w-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Real-Time Tracking</h4>
              <p className="text-muted-foreground">
                Track organ availability and match status in real-time across the network.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardContent className="pt-6">
              <Users className="h-12 w-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Smart Matching</h4>
              <p className="text-muted-foreground">
                AI-powered algorithm ensures optimal donor-recipient matching based on medical criteria.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardContent className="pt-6">
              <Database className="h-12 w-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Decentralized Network</h4>
              <p className="text-muted-foreground">
                No single point of failure with distributed data across multiple nodes.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardContent className="pt-6">
              <Lock className="h-12 w-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Privacy Protected</h4>
              <p className="text-muted-foreground">
                HIPAA-compliant encryption ensures patient data remains confidential.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardContent className="pt-6">
              <Heart className="h-12 w-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Save Lives</h4>
              <p className="text-muted-foreground">
                Reduce waiting times and increase successful transplants through efficient coordination.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/30 rounded-lg">
        <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
        <div className="max-w-4xl mx-auto space-y-8">
          {[
            {
              step: 1,
              title: "Registration",
              desc: "Donors, recipients, and hospitals register on the blockchain network with verified credentials.",
            },
            {
              step: 2,
              title: "Smart Matching",
              desc: "AI algorithm analyzes medical compatibility and matches donors with recipients based on priority and compatibility.",
            },
            {
              step: 3,
              title: "Blockchain Verification",
              desc: "All transactions are recorded on the blockchain, ensuring transparency and preventing fraud.",
            },
            {
              step: 4,
              title: "Real-Time Coordination",
              desc: "Hospitals coordinate transplant procedures with real-time updates and secure communication channels.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-6 items-start">
              <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold flex-shrink-0">
                {item.step}
              </div>
              <div>
                <h4 className="text-xl font-semibold mb-2">{item.title}</h4>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 LifeLink TrustChain. Saving lives through blockchain technology.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
