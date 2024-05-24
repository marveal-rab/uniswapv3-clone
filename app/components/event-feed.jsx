"use client";

import React, { useEffect, useReducer, useContext } from "react";
import { ethers } from "ethers";
import { ContractContext } from "@/app/context/web3-provider";

const getEvents = (pool) => {
  return Promise.all([
    pool.queryFilter("Mint", "earliest", "latest"),
    pool.queryFilter("Swap", "earliest", "latest"),
  ]).then(([mints, swaps]) => {
    return Promise.resolve((mints || []).concat(swaps || []));
  });
};

const subscribeToEvents = (pool, callback) => {
  pool.once("Mint", (a, b, c, d, e, f, g, event) => callback(event));
  pool.once("Swap", (a, b, c, d, e, f, g, event) => callback(event));
};

const renderAmount = (amount) => {
  if (amount) {
    return ethers.utils.formatUnits(amount);
  }
  return "";
};

const renderMint = (args) => {
  const lowerTick = args[2];
  const upperTick = args[3];
  const amount0 = args[5];
  const amount1 = args[6];

  return (
    <span>
      <strong>Mint</strong>
      [range: [{lowerTick}-{upperTick}], amounts: [{renderAmount(amount0)}-
      {renderAmount(amount1)}]]
    </span>
  );
};

const renderSwap = (args) => {
  const amount0 = args[2];
  const amount1 = args[3];
  return (
    <span>
      <strong>Swap</strong>
      [amount0: {renderAmount(amount0)}, amount1: {renderAmount(amount1)}]
    </span>
  );
};

const renderEvent = (event, i) => {
  let content;
  switch (event.event) {
    case "Mint":
      content = renderMint(event.args);
      break;
    case "Swap":
      content = renderSwap(event.args);
      break;
    default:
      throw new Error("Unknown event: " + event.event);
  }
  return <li key={i}>{content}</li>;
};

const isMintOrSwap = (event) => {
  return event.event === "Mint" || event.event === "Swap";
};

const cleanEvents = (events) => {
  return events
    .sort((a, b) => b.blockNumber - a.blockNumber)
    .filter((el, i, arr) => {
      return (
        i === 0 ||
        el.blockNumber !== arr[i - 1].blockNumber ||
        el.logIndex !== arr[i - 1].logIndex
      );
    });
};

const eventsReducer = (state, action) => {
  switch (action.type) {
    case "add":
      return cleanEvents([action.value, ...state]);
    case "set":
      return cleanEvents(action.value);
    default:
      throw new Error("Unknown action: " + action.type);
  }
};

export const EventsFeed = (props) => {
  const [events, dispatch] = useReducer(eventsReducer, []);
  const { pool } = useContext(ContractContext);

  useEffect(() => {
    if (pool) {
      subscribeToEvents(pool, (event) =>
        dispatch({ type: "add", value: event }),
      );
      getEvents(pool).then((events) =>
        dispatch({ type: "set", value: events }),
      );
    }
  }, [pool]);

  return (
    <ul className="py-6">
      {events &&
        events.filter(isMintOrSwap).map((el, idx) => renderEvent(el, idx))}
    </ul>
  );
};
