type Props = {
  card: any;
};

export default function PaymentCard({ card }: Props) {

  return (

    <div className="border rounded-lg p-4 flex flex-col gap-3">

      <div className="flex justify-between items-center">

        <div className="flex gap-2 items-center">
          <span className="font-semibold">{card.brand}</span>
          <span>****{card.last4}</span>
        </div>

        {card.default && (
          <span className="text-[10px] border px-2 py-0.5 rounded">
            Default
          </span>
        )}

      </div>

      <p className="text-[12px] text-[#7a7a7a]">
        Expires {card.expiry}
      </p>

      <div className="flex justify-between text-[12px]">

        <button className="border px-2 py-1 rounded">
          Set as default
        </button>

        <button className="text-red-500">
          Delete
        </button>

      </div>

    </div>
  );
}