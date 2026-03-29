import { useEffect, useState } from "react";
import api from "@/api/axios";
import { useNavigate } from "react-router-dom";

interface Package {
  id: string;
  title: string;
  description: string;
  price: number;
  sessionsAllowed: number;
  validityDays: number;
  createdAt: string;
  updatedAt: string;
}

const PackageList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const getPackages = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/package/find-all");
      setData(response.data.data);
      setIsLoading(false);
      setError(false);
    } catch (error) {
      setError(true);
      setIsLoading(false);
      setData([]);
    }
  };

  useEffect(() => {
    getPackages();
  }, []);

  if (isLoading) {
    return <p className="text-center text-gray-600">Loading packages...</p>;
  }

  if (error) {
    return (
      <p className="text-center text-red-500">
        Failed to load packages. Please try again later.
      </p>
    );
  }

  return (
    <section className="bg-gray-800">
      <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
        <div className="mx-auto max-w-screen-md text-center mb-8 lg:mb-12">
          <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-white ">
            Please Select a Plan
          </h2>
          <button
            onClick={() => {
              navigate(-1);
            }}
            className="text-emerald-400 hover:text-emerald-300 text-sm font-medium pb-2  flex justify-start items-start"
          >
            ← Back
          </button>
          <p className="mb-5 font-light text-gray-200 sm:text-xl ">
            Choose a plan and make a payment to connect with our experts.
          </p>
        </div>

        {/* Display Packages */}
        <div className="space-y-8 lg:grid lg:grid-cols-3 sm:gap-6 xl:gap-10 lg:space-y-0">
          {data.map((pkg) => (
            <div
              key={pkg.id}
              className="flex flex-col p-6 mx-auto max-w-lg text-center text-white bg-[#0B364F] rounded-lg border border-gray-100 shadow "
            >
              <h3 className="mb-4 text-2xl font-semibold">{pkg.title}</h3>
              <p className="font-light text-gray-200 sm:text-lg ">
                {pkg.description}
              </p>

              <div className="flex justify-center items-baseline my-8">
                <span className="mr-2 text-5xl font-extrabold">
                  ETB {pkg.price}
                </span>
                <span className="text-gray-200 ">/plan</span>
              </div>

              <ul role="list" className="mb-8 space-y-4 text-left">
                <li className="flex items-center space-x-3">
                  <span>
                    Sessions allowed: <b>{pkg.sessionsAllowed}</b>
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <span>
                    Validity: <b>{pkg.validityDays} days</b>
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <span>
                    Created: {new Date(pkg.createdAt).toLocaleDateString()}
                  </span>
                </li>
              </ul>

              <button
                onClick={() =>
                  navigate("/booking/checkout", { state: { pkg } })
                }
                className="bg-[#0B8FAC] hover:bg-[#0ea4c6] px-4 py-2 rounded text-gray-100 "
              >
                Pay
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PackageList;
