// @ts-nocheck
// DONT let this be merged
//
// leaving some of these if the data conversions and utility functions are needed
import { Action } from "./types";

const calculateNetPrice = (crossPrice: number, taxPercentage: number): number =>
  crossPrice / (1 + taxPercentage / 100);

const calculatePrice = (netPrice: number, taxPercentage: number): number =>
  Number((netPrice * (1 + taxPercentage / 100)).toFixed(2));

    function updatePricingType (action: Action) {
      const newPricingType = { ...action.pricingType };

      if (action.changeField) {
        const currentTaxPercentage = Number( state.taxPercentageOptions.find( (v) => v.value === action.pricingType.taxPercentagePk)?.label);

        switch (action.changeField) {
          case "highestPrice":
            newPricingType.highestPriceNet = calculateNetPrice( action.pricingType.highestPrice as number, currentTaxPercentage);
            break;
          case "highestPriceNet":
            newPricingType.highestPrice = calculatePrice( action.pricingType.highestPriceNet as number, currentTaxPercentage);
            break;

          case "lowestPrice":
            newPricingType.lowestPriceNet = calculateNetPrice( action.pricingType.lowestPrice as number, currentTaxPercentage);
            break;
          case "lowestPriceNet":
            newPricingType.lowestPrice = calculatePrice( action.pricingType.lowestPriceNet as number, currentTaxPercentage);
            break;
          case "taxPercentagePk":
            newPricingType.lowestPriceNet = calculateNetPrice( action.pricingType.lowestPrice as number, currentTaxPercentage);
            newPricingType.highestPriceNet = calculateNetPrice( action.pricingType.highestPrice as number, currentTaxPercentage);
            break;
          default:
        }
      }
    }

