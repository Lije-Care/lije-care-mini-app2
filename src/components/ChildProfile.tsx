import { useEffect } from "react";
import { useDispatch } from "react-redux";
// import { RootState } from "@/redux/store";
// import { FaEdit, FaArrowLeft, FaArrowRight } from "react-icons/fa";
// import { Subheadline, Text } from "@telegram-apps/telegram-ui";

// import { fetchChildrenByParentId } from "@/redux/slices/childSlice";

const ChildrenDisplay = () => {
  const dispatch = useDispatch();
  // const [isEditing, setIsEditing] = useState(false);
  // const handleNext = () => {
  //   if (currentIndex < children.length - 1) {
  //     setCurrentIndex(currentIndex + 1);
  //     setEditedChild({ ...children[currentIndex + 1] });
  //     setIsEditing(false);
  //   }
  // };

  // const handlePrev = () => {
  //   if (currentIndex > 0) {
  //     setCurrentIndex(currentIndex - 1);
  //     setEditedChild({ ...children[currentIndex - 1] });
  //     setIsEditing(false);
  //   }
  // };

  // const handleEdit = () => {
  //   setIsEditing(true);
  // };

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  //   const { name, value } = e.target;
  //   setEditedChild((prev) => ({
  //     ...prev,
  //     [name]: value === "" ? null : value, // Handle empty values as null
  //   }));
  // };

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   console.log(editedChild);
  //   // dispatch(updateChild(editedChild));
  //   setIsEditing(false);
  // };
  useEffect(() => {
    // dispatch(fetchChildrenByParentId());
  }, [dispatch]);
  return (
    <div className="flex flex-col items-center p-4 w-full max-w-lg mx-auto">
      <div className="shadow-lg rounded-lg p-6 w-full relative">
        {/* <button onClick={handleEdit} className="absolute top-2 right-2 text-blue-500">
          <FaEdit size={20} />
        </button> */}

        {/* {isEditing ? (
          <form onSubmit={handleSubmit} className="grid gap-2">
            <label className="font-medium">Name:</label>
            <input
              type="text"
              name="name"
              value={editedChild.name || ""}
              onChange={handleChange}
              className="border p-2 rounded"
            />

            <label className="font-medium">Date of Birth:</label>
            <input
              type="date"
              name="date_of_birth"
              value={editedChild.date_of_birth ? editedChild.date_of_birth.split("T")[0] : ""}
              onChange={handleChange}
              className="border p-2 rounded"
            />

            <label className="font-medium">Gender:</label>
            <select name="gender" value={editedChild.gender || ""} onChange={handleChange} className="border p-2 rounded">
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>

            <label className="font-medium">Weight (kg):</label>
            <input
              type="number"
              name="weight"
              value={editedChild.weight || ""}
              onChange={handleChange}
              className="border p-2 rounded"
            />

            <label className="font-medium">Height (cm):</label>
            <input
              type="number"
              name="height"
              value={editedChild.height || ""}
              onChange={handleChange}
              className="border p-2 rounded"
            />

            <label className="font-medium">MUAC:</label>
            <input
              type="number"
              name="muac"
              value={editedChild.muac || ""}
              onChange={handleChange}
              className="border p-2 rounded"
            />

            <label className="font-medium">Dietary Restrictions:</label>
            <input
              type="text"
              name="dietary_restrictions"
              value={editedChild.dietary_restrictions || ""}
              onChange={handleChange}
              className="border p-2 rounded"
            />

            <label className="font-medium">Allergies:</label>
            <input
              type="text"
              name="allergies"
              value={editedChild.allergies || ""}
              onChange={handleChange}
              className="border p-2 rounded"
            />

            <label className="font-medium">Medications:</label>
            <input
              type="text"
              name="medications"
              value={editedChild.medications || ""}
              onChange={handleChange}
              className="border p-2 rounded"
            />

            <button type="submit" className="bg-blue-500 text-white p-2 rounded mt-2">
              Save
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-y-3 text-gray-700">
            <Subheadline
    level="1"
    weight="3"
  >Namess:</Subheadline>
            <span>{children[currentIndex].name}</span>

            <span className="font-medium">Date of Birth:</span>
            <span>{children[currentIndex].date_of_birth.split("T")[0]}</span>

            <span className="font-medium">Gender:</span>
            <span>{children[currentIndex].gender}</span>

            <span className="font-medium">Weight (kg):</span>
            <span>{children[currentIndex].weight || "N/A"}</span>

            <span className="font-medium">Height (cm):</span>
            <span>{children[currentIndex].height || "N/A"}</span>

            <span className="font-medium">MUAC:</span>
            <span>{children[currentIndex].muac || "N/A"}</span>

            <span className="font-medium">Dietary Restrictions:</span>
            <span>{children[currentIndex].dietary_restrictions || "None"}</span>

            <span className="font-medium">Allergies:</span>
            <span>{children[currentIndex].allergies || "None"}</span>

            <span className="font-medium">Medications:</span>
            <span>{children[currentIndex].medications || "None"}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between w-full mt-4">
        <button onClick={handlePrev} disabled={currentIndex === 0} className="bg-gray-300 p-2 rounded disabled:opacity-50">
          <FaArrowLeft />
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex === children.length - 1}
          className="bg-gray-300 p-2 rounded disabled:opacity-50"
        >
          <FaArrowRight />
        </button>*/}
      </div> 
    </div>
  );
};

export default ChildrenDisplay;
