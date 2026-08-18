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
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="flex items-center justify-between px-10 py-5">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="logo" width={40} height={40} />
          <h2 className="font-bold text-3xl">AI Trip Planner</h2>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-12">
          <Link href="/">
            <h2 className="hover:text-primary transition-colors">
              Home
            </h2>
          </Link>

          <Link href="/pricing">
            <h2 className="hover:text-primary transition-colors">
              Pricing
            </h2>
          </Link>

          <Link href="/contact-us">
            <h2 className="hover:text-primary transition-colors">
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
              <Link href="/create-new-trip">
                <Button className='px-6 py-5 text-base'>
                  Create New Trip</Button>
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