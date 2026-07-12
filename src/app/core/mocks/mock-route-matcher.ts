import type { MockHttpMethod, MockRoute } from "./mock-types";

const pathSegments = (path: string): readonly string[] =>
  path.split("/").filter(Boolean);

const isPlaceholder = (segment: string): boolean =>
  segment.startsWith("{") && segment.endsWith("}");

export const matchPath = (pattern: string, path: string): boolean => {
  const patternParts = pathSegments(pattern);
  const pathParts = pathSegments(path);
  if (patternParts.length !== pathParts.length) {
    return false;
  }
  return patternParts.every((part, index) => {
    const value = pathParts[index];
    return value !== undefined && (isPlaceholder(part) || part === value);
  });
};

export const extractPathParams = (
  pattern: string,
  path: string,
): Readonly<Record<string, string>> => {
  const patternParts = pathSegments(pattern);
  const pathParts = pathSegments(path);
  const params: Record<string, string> = {};
  patternParts.forEach((part, index) => {
    const value = pathParts[index];
    if (isPlaceholder(part) && value !== undefined) {
      params[part.slice(1, -1)] = decodeURIComponent(value);
    }
  });
  return params;
};

export const matchRoute = (
  method: MockHttpMethod,
  path: string,
  routes: readonly MockRoute[],
): MockRoute | undefined =>
  routes.find(
    (route) => route.method === method && matchPath(route.pattern, path),
  );
