/*

Based on DR by Oliver

Most stats are team based and then estimated to a player by dividing by 5 and multiplying by steals*blocks

assumptions of IDR:
    - all teammates are equally good at forcing misses and turnovers.
    - team DRtg can be used as a basis for individial defense, with stops providing an individual deviation.
    - all 5 players on court shoulder the same amount of defensive possessions. (In short, for all players %Tm_DPoss=0.2)

Glossary:
IDR = individual defensive rating
TDR = team defensive rating
D_Pts_per_ScPoss = how many points, on average, the player allows when the shot is made (or a foul is committed).
Stops1 = countable stops caused by a player
Stops2 = uncountable stops caused by a player
FMwt = the difficulty of forcing a miss against the difficulty of grabbing a defensive rebound 
DOR% = defensive offensive rebound percentage
DFG% = defensive field goal percentage
Opp_ORB = opponent offensive rebounds
Team_DRB = team defensive rebounds
Opp_FG% = opponent field goal percentage 

*/

async function calculatePlayerDRTG(){

    var stl
    var blk
    var drb
    var mp
    var pf

    var teamStl
    var teamBlk
    var teamDrb
    var teamMp
    var teamPf
    var teamDfgp
    var teamPos

    var oppPts
    var oppTov
    var oppOrb
    var oppFgm
    var oppFga
    var oppFtm
    var oppFta

    var stats = {
        individual = {
            stl: stl, 
            blk: blk, 
            drb: drb, 
            mp: mp,
            pf: pf
        },
        team = {
            stl: teamStl,
            blk: teamBlk, 
            drb: teamDrb, 
            mp: teamMp, 
            pf: teamPf,
            dfgp: teamDfgp, 
            pos: teamPos
        },
        opponent = {
            pts: oppPts,
            tov: oppTov,
            orb: oppOrb,
            fgm: oppFgm,
            fga: oppFga,
            ftm: oppFtm,
            fta: oppFta
        }
    }

    var dorp = stats.opponent.orb / (stats.opponent.orb + stats.team.drb)
    var fmwt = (stats.team.dfgp * (1 - dorp)) / (stats.team.dfgp * (1 - dorp) + (1 - stats.team.dfgp) * dorp)
    var stops1 = stats.individual.stl + (stats.individual.blk*fmwt*(1-(1.07)*dorp)) + stats.individual.drb * (1 - fmwt)
    var stops2 = (((stats.opponent.fga - stats.opponent.fgm - stats.team.blk) / stats.team.mp) * fmwt * (1- (1.07*dorp)) + ((stats.opponent.tov - stats.team.stl) / stats.team.mp)) * stats.individual.mp + ((stats.individual.pf/stats.team.pf) * 0.4 * stats.opponent.fta * (1-(stats.opponent.ftm/stats.opponent.fta)^2)) 
    var stopP = ((stops1 + stops2) * stats.opponent.mp) / (stats.team.pos * stats.individual.mp)
    var dPtsPerScPoss = stats.opponent.pts / (stats.opponent.fgm + (1 - (1 - (stats.opponent.ftm/stats.opponent.fta))^2) * stats.opponent.fta*0.4)
    var teamDrtg = 100 * (stats.opponent.pts / stats.team.pos)
    var individualDrtg = teamDrtg + (0.2 * (100 * dPtsPerScPoss * (1 - stopP) - teamDrtg))

    return individualDrtg;
}

