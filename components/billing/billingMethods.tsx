import PaymentCard from "./paymentCard";
import { Button } from "../ui/button";
const cards = [
  { id: 1, brand: "VISA", last4: "8345", expiry: "03/2030", default: true },
  { id: 2, brand: "VISA", last4: "8345", expiry: "03/2030" },
  { id: 3, brand: "VISA", last4: "8345", expiry: "03/2030" },
];

export default function PaymentMethods() {

  return (

    <div className="mt-6 space-y-6">

      <h2 className="text-[14px] font-medium">Payment methods</h2>

      <div className="grid md:grid-cols-3 gap-4">

        {cards.map((c) => (
          <PaymentCard key={c.id} card={c} />
        ))}

      </div>

      <Button className="text-[13px] text-black bg-gray-100 border rounded px-3 py-1">
        Add payment method
      </Button>

    </div>
  );
}