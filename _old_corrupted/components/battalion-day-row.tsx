@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 195 20% 95%;
    --foreground: 200 15% 20%;
    --card: 195 20% 99%;
    --card-foreground: 200 15% 20%;
    --popover: 195 20% 99%;
    --popover-foreground: 200 15% 20%;
    --primary: 196 23% 58%;
    --primary-foreground: 195 20% 10%;
    --secondary: 195 15% 90%;
    --secondary-foreground: 200 15% 10%;
    --muted: 195 15% 90%;
    --muted-foreground: 200 10% 45%;
    --accent: 80 40% 65%;
    --accent-foreground: 80 0% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 195 15% 88%;
    --input: 195 15% 88%;
    --ring: 196 23% 58%;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.5rem;
    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
  .dark {
    --background: 200 15% 12%;
    --foreground: 195 20% 95%;
    --card: 200 15% 17%;
    --card-foreground: 195 20% 95%;
    --popover: 200 15% 17%;
    --popover-foreground: 195 20% 95%;
    --primary: 196 23% 58%;
    --primary-foreground: 195 20% 10%;
    --secondary: 200 15% 25%;
    --secondary-foreground: 195 20% 98%;
    --muted: 200 15% 25%;
    --muted-foreground: 195 10% 60%;
    --accent: 80 40% 65%;
    --accent-foreground: 80 0% 10%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 200 15% 25%;
    --input: 200 15% 25%;
    --ring: 196 23% 58%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

@media print {
  @page {
    margin: 1.5cm;
  }
  body {
    background-color: white !important;
    color: black !important;
  }
  .print\:hidden {
    display: none;
  }
  .print\:block {
    display: block;
  }
  .print\:p-0 {
    padding: 0;
  }
  .print\:p-2 {
    padding: 0.5rem;
  }
  .print\:mb-4 {
    margin-bottom: 1rem;
  }
  .print\:text-xs {
    font-size: 0.75rem;
    line-height: 1rem;
  }
  .break-after-page {
    break-after: page;
  }
  .break-inside-avoid {
    break-inside: avoid;
  }
  .print-bg-muted {
    background-color: #f1f5f9 !important; /* Cor de `muted` do Tailwind */
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}