import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import React from "react";

const AddressCard = ({
  addressInfo,
  handleDeleteAddress,
  handleEditAddress,
}) => {
  return (
    <Card className="shadow-lg border border-gray-300 rounded-lg bg-white">
      <CardContent className="grid p-6 gap-4">
        <div className="space-y-2">
          <Label className="block font-bold text-md text-gray-700">
            Address:
            <span className="font-normal text-gray-600 text-sm ml-2">
              {addressInfo?.address}
            </span>
          </Label>
          <Label className="block font-bold text-md text-gray-700">
            City:
            <span className="font-normal text-gray-600 text-sm ml-2">
              {addressInfo?.city}
            </span>
          </Label>
          <Label className="block font-bold text-md text-gray-700">
            Zipcode:
            <span className="font-normal text-gray-600 text-sm ml-2">
              {addressInfo?.zipcode}
            </span>
          </Label>
          <Label className="block font-bold text-md text-gray-700">
            Phone:
            <span className="font-normal text-gray-600 text-sm ml-2">
              {addressInfo?.phone}
            </span>
          </Label>
          <Label className="block font-bold text-md text-gray-700">
            Notes:
            <span className="font-normal text-gray-600 text-sm ml-2">
              {addressInfo?.notes}
            </span>
          </Label>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between p-3 ">
        <Button onClick={() => handleEditAddress(addressInfo)}>Edit</Button>
        <Button
          variant="destructive"
          onClick={() => handleDeleteAddress(addressInfo)}
        >
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AddressCard;