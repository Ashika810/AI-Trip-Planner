"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import {
  SignInButton,
  UserButton,
  Show,
} from "@clerk/nextjs";

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="flex items-center justify-between px-6 py-5 lg:px-10">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2"
        >
          <Image
            src="/logo.svg"
            alt="AI Trip Planner logo"
            width={40}
            height={40}
          />

          <h2 className="text-2xl font-bold lg:text-3xl">
            AI Trip Planner
          </h2>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 md:flex lg:gap-12">
          <Link href="/">
            <h2 className="transition-colors hover:text-primary">
              Home
            </h2>
          </Link>

          <Link href="/my-trips">
            <h2 className="transition-colors hover:text-primary">
              My Trips
            </h2>
          </Link>

          <Link href="/pricing">
            <h2 className="transition-colors hover:text-primary">
              Pricing
            </h2>
          </Link>

          <Link href="/contact-us">
            <h2 className="transition-colors hover:text-primary">
              Contact Us
            </h2>
          </Link>
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button>Get Started</Button>
            </SignInButton>
          </Show>

          <Show when="signed-in">
            <>
              <Link href="/my-trips">
                <Button
                  variant="outline"
                  className="hidden px-5 py-5 text-base sm:inline-flex"
                >
                  My Trips
                </Button>
              </Link>

              <Link href="/create-new-trip">
                <Button className="px-5 py-5 text-base lg:px-6">
                  Create New Trip
                </Button>
              </Link>

              <UserButton />
            </>
          </Show>
        </div>
      </div>
    </header>
  );
}

export default Header;