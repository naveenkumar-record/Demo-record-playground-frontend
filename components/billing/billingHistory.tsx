import InvoiceTable from "./InvoiceTable";

export default function BillingHistory() {

  return (

    <div className="mt-6">

      <h2 className="text-[14px] font-medium mb-4">
        Billing history
      </h2>

      <InvoiceTable />

    </div>

  );
}