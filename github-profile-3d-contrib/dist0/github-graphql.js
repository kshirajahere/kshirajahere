"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchData = exports.fetchNext = exports.fetchFirst = exports.URL = void 0;
const axios_1 = __importDefault(require("axios"));
exports.URL = process.env.GITHUB_ENDPOINT || 'https://api.github.com/graphql';
const maxReposOneQuery = 100;
const fetchFirst = async (token, userName, year = null) => {
    const yearArgs = year
        ? `(from:"${year}-01-01T00:00:00.000Z", to:"${year}-12-31T23:59:59.000Z")`
        : '';
    const headers = {
        Authorization: `bearer ${token}`,
    };
    const request = {
        query: `
            query($login: String!) {
                user(login: $login) {
                    contributionsCollection${yearArgs} {
                        contributionCalendar {
                            isHalloween
                            totalContributions
                            weeks {
                                contributionDays {
                                    contributionCount
                                    contributionLevel
                                    date
                                }
                            }
                        }
                        commitContributionsByRepository(maxRepositories: ${maxReposOneQuery}) {
                            repository {
                                primaryLanguage {
                                    name
                                    color
                                }
                            }
                            contributions {
                                totalCount
                            }
                        }
                        totalCommitContributions
                        totalIssueContributions
                        totalPullRequestContributions
                        totalPullRequestReviewContributions
                        totalRepositoryContributions
                    }
                    repositories(first: ${maxReposOneQuery}, ownerAffiliations: OWNER) {
                        edges {
                            cursor
                        }
                        nodes {
                            forkCount
                            stargazerCount
                        }
                    }
                }
            }
        `.replace(/\s+/g, ' '),
        variables: { login: userName },
    };
    const response = await axios_1.default.post(exports.URL, request, {
        headers: headers,
    });
    return response.data;
};
exports.fetchFirst = fetchFirst;
const fetchNext = async (token, userName, cursor) => {
    const headers = {
        Authorization: `bearer ${token}`,
    };
    const request = {
        query: `
            query($login: String!, $cursor: String!) {
                user(login: $login) {
                    repositories(after: $cursor, first: ${maxReposOneQuery}, ownerAffiliations: OWNER) {
                        edges {
                            cursor
                        }
                        nodes {
                            forkCount
                            stargazerCount
                        }
                    }
                }
            }
        `.replace(/\s+/g, ' '),
        variables: {
            login: userName,
            cursor: cursor,
        },
    };
    const response = await axios_1.default.post(exports.URL, request, {
        headers: headers,
    });
    return response.data;
};
exports.fetchNext = fetchNext;
/** Fetch data from GitHub GraphQL */
const fetchData = async (token, userName, maxRepos, year = null) => {
    const res1 = await (0, exports.fetchFirst)(token, userName, year);
    const result = res1.data;
    if (result && result.user.repositories.nodes.length === maxReposOneQuery) {
        const repos1 = result.user.repositories;
        let cursor = repos1.edges[repos1.edges.length - 1].cursor;
        while (repos1.nodes.length < maxRepos) {
            const res2 = await (0, exports.fetchNext)(token, userName, cursor);
            if (res2.data) {
                const repos2 = res2.data.user.repositories;
                repos1.nodes.push(...repos2.nodes);
                if (repos2.nodes.length !== maxReposOneQuery) {
                    break;
                }
                cursor = repos2.edges[repos2.edges.length - 1].cursor;
            }
            else {
                break;
            }
        }
    }
    return res1;
};
exports.fetchData = fetchData;
//# sourceMappingURL=github-graphql.js.map