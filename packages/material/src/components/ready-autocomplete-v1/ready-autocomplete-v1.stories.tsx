import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useCallback } from "react";

import { ReadyAutocompleteV1 } from "./ready-autocomplete-v1.component.tsx";

// Mock async API function
async function mockGetOptions({
  keyword,
  pageIndex,
  pageSize,
}: {
  keyword: string;
  pageIndex: number;
  pageSize: number;
}) {
  // simulate delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // generate mock data
  const allItems = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    name: `Option ${i + 1}`,
  }));

  const filtered = keyword
    ? allItems.filter((item) =>
        item.name.toLowerCase().includes(keyword.toLowerCase()),
      )
    : allItems; // Return all items when keyword is empty

  const items = filtered.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize,
  );

  return {
    items,
    totalCount: filtered.length,
  };
}

const meta: Meta<typeof ReadyAutocompleteV1> = {
  title: "Components/ReadyAutocompleteV1",
  component: ReadyAutocompleteV1,
  tags: ["autodocs"],
  args: {
    label: "Select an option",
    getOptionLabel: (option: any) => option.name,
    pageSize: 20,
    sx: { width: 300 },
  },
};

export default meta;

type Story = StoryObj<typeof ReadyAutocompleteV1>;

/**
 * Default story
 */
export const Default: Story = {
  render: (args) => {
    const memoizedGetOptions = useCallback(mockGetOptions, []);
    return (
      <ReadyAutocompleteV1 {...(args as any)} getOptions={memoizedGetOptions} />
    );
  },
};

/**
 * Story with pre-filled value
 */
export const WithDefaultValue: Story = {
  render: (args) => {
    const memoizedGetOptions = useCallback(mockGetOptions, []);
    return (
      <ReadyAutocompleteV1
        {...(args as any)}
        getOptions={memoizedGetOptions}
        defaultValue={{ id: 0, name: "Option 1" }}
      />
    );
  },
};

/**
 * Story demonstrating multiple selection
 */
export const MultipleSelect: Story = {
  render: (args) => {
    const memoizedGetOptions = useCallback(mockGetOptions, []);
    return (
      <ReadyAutocompleteV1
        {...(args as any)}
        getOptions={memoizedGetOptions}
        multiple={true}
      />
    );
  },
};
