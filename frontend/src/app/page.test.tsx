import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home page", () => {
    it("renders the Popula data source upload workspace", () => {
        render(<Home />);

        expect(screen.getByRole("main")).toBeInTheDocument();
        expect(
            screen.getByRole("heading", {
                name: /upload and manage your demographic datasets/i,
            })
        ).toBeInTheDocument();
        expect(screen.getByText(/drop your csv file here/i)).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /ask zio/i })
        ).toBeInTheDocument();
    });
});