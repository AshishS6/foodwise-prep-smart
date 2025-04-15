
import POSContainer from "@/components/POS/POSContainer";
import { Helmet } from "react-helmet";

const POS = () => {
  return (
    <>
      <Helmet>
        <title>Point of Sale - FoodWise</title>
      </Helmet>
      <POSContainer />
    </>
  );
};

export default POS;
