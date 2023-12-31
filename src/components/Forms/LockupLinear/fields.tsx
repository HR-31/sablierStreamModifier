import _ from "lodash";
import { useCallback } from "react";
import type { ChangeEvent } from "react";
import Input from "../../Input";
import Select from "../../Select";
import useFormStore from "./store";
import { REGEX_ADDRESS, REGEX_FLOAT, REGEX_INTEGER } from "../../../constants";

export function Cancelability() {
  const { cancelability, update } = useFormStore((state) => ({
    cancelability: state.cancelability,
    update: state.api.update,
  }));

  const onChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const value = (() => {
        const input = e.target.value;

        return ["true", true].includes(input);
      })();

      update({ cancelability: value });
    },
    [update]
  );

  return (
    <Select
      label={"Cancelability"}
      id={"cancelability"}
      value={_.toString(cancelability)}
      source={[
        { label: "On (Can be canceled later)", value: "true" },
        { label: "Off (Can never be canceled)", value: "false" },
      ]}
      onChange={onChange}
    />
  );
}

export function Token() {
  const { token, update } = useFormStore((state) => ({
    token: state.token,
    update: state.api.update,
  }));

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = (() => {
        const input = e.target.value;
        if (_.isNil(input) || _.toString(input).length === 0) {
          return "";
        }
        return _.toString(input);
      })();

      update({ token: value });
    },
    [update]
  );

  return (
    <Input
      label={"Token (cannot change)"}
      id={"token"}
      value={token}
      onChange={onChange}
      format={"text"}
      placeholder={"Address of the asset..."}
      disabled={true}
    />
  );
}

export function Amount() {
  const { amount, update } = useFormStore((state) => ({
    amount: state.amount,
    update: state.api.update,
  }));

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = (() => {
        const input = e.target.value;
        if (_.isNil(input) || _.toString(input).length === 0) {
          return "";
        }
        return _.toString(input);
      })();
      const regex = /^[0-9]+([.,][0-9]+)?$/;
      if (value !== "" && !new RegExp(regex).test(value)) {
        return;
      }

      update({ amount: value });
    },
    [update]
  );

  return (
    <Input
      label={"Amount"}
      id={"amount"}
      value={amount}
      onChange={onChange}
      format={"number"}
      placeholder={"Amount to be streamed (no decimals)..."}
    />
  );
}

export function Recipient() {
  const { recipient, update } = useFormStore((state) => ({
    recipient: state.recipient,
    update: state.api.update,
  }));

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = (() => {
        const input = e.target.value;
        if (_.isNil(input) || _.toString(input).length === 0) {
          return "";
        }

        if (!_.toString(input).startsWith("0")) {
          return "";
        }

        return _.toString(input);
      })();

      if (value !== "" && !new RegExp(REGEX_ADDRESS).test(value)) {
        return;
      }

      update({ recipient: value });
    },
    [update]
  );

  return (
    <Input
      label={"Recipient Address (cannot change)"}
      id={"recipient"}
      value={recipient}
      onChange={onChange}
      format={"text"}
      placeholder={"Recipient 0x address..."}
      disabled={true}
    />
  );
}

export function Duration() {
  const { duration, update } = useFormStore((state) => ({
    duration: state.duration,
    update: state.api.update,
  }));

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = (() => {
        const input = e.target.value;
        if (_.isNil(input) || _.toString(input).length === 0) {
          return "";
        }
        return _.toString(input);
      })();

      if (value !== "" && !new RegExp(REGEX_INTEGER).test(value)) {
        return;
      }

      update({ duration: value });
    },
    [update]
  );

  return (
    <Input
      label={"Duration (in seconds)"}
      id={"duration"}
      value={duration}
      onChange={onChange}
      format={"text"}
      placeholder={"Duration in seconds e.g. 86400 (1 Day)..."}
    />
  );
}
